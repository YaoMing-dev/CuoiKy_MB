import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Share } from 'react-native';
import { Text, Avatar, ActivityIndicator, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFeedItems, seedFeedData } from '../../services/feedService';
import { auth, db } from '../../config/firebase';
import { COLORS, SIZES } from '../../config/constants';
import CommentModal from '../../components/CommentModal';

function FeedPost({ item, onPress, onComment }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const [commentCount, setCommentCount] = useState(0);

  // Load real comment count
  useEffect(() => {
    if (!item?.id) return;
    
    const loadCommentCount = async () => {
      try {
        const q = query(
          collection(db, 'comments'),
          where('feedItemId', '==', item.id)
        );
        const snapshot = await getDocs(q);
        setCommentCount(snapshot.docs.length);
      } catch (error) {
        // Collection might not exist yet
        console.log('[FEED] Comment count error:', error.message);
        setCommentCount(0);
      }
    };
    
    loadCommentCount();
  }, [item?.id]);

  // Load real like count
  useEffect(() => {
    if (!item?.id) return;
    
    const loadLikeCount = async () => {
      try {
        const q = query(
          collection(db, 'likes'),
          where('feedItemId', '==', item.id)
        );
        const snapshot = await getDocs(q);
        setLikeCount(snapshot.docs.length);
        
        // Check if current user liked this post
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          const userLiked = snapshot.docs.some(doc => doc.data().userId === currentUserId);
          setLiked(userLiked);
        }
      } catch (error) {
        console.log('[FEED] Like count error:', error.message);
        setLikeCount(0);
      }
    };
    
    loadLikeCount();
  }, [item?.id]);

  const handleLike = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !item?.id) return;

    try {
      if (liked) {
        // Unlike: delete from Firestore
        const q = query(
          collection(db, 'likes'),
          where('feedItemId', '==', item.id),
          where('userId', '==', currentUserId)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => deleteDoc(doc.ref));
        
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like: add to Firestore
        await addDoc(collection(db, 'likes'), {
          feedItemId: item.id,
          userId: currentUserId,
          createdAt: serverTimestamp(),
        });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('[FEED] Error toggling like:', error);
    }
  };

  const handleComment = () => {
    onComment(item);
  };

  const handleShare = async () => {
    try {
      const targetEmoji = item.targetType === 'place' ? '📍' : '📅';
      const message = `Check out ${targetEmoji} ${item.targetName} on ExploreEase!`;
      
      await Share.share({
        message,
        title: item.targetName,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch (e) {
      console.error('[FEED] timeAgo error:', e);
      return 'recently';
    }
  };

  if (!item || !item.action) {
    console.warn('[FEED] Invalid item:', item);
    return null;
  }

  try {
    // Review post
    if (item.action === 'reviewed') {
      return (
        <Card style={s.card} onPress={onPress}>
          <Card.Title
            title={item.userName || 'User'}
            subtitle={`reviewed ${item.targetName || 'a place'} • ${timeAgo(item.timestamp)}`}
            left={(props) => <Avatar.Text {...props} size={40} label={(item.userName?.[0] || 'U').toUpperCase()} />}
          />
          {item.rating > 0 && (
            <View style={s.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= item.rating ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFB800"
                />
              ))}
            </View>
          )}
          {item.reviewText && (
            <Card.Content style={{ marginTop: 8 }}>
              <Text>{item.reviewText}</Text>
            </Card.Content>
          )}
          <Card.Cover source={{ uri: item.imageUrl }} style={{ marginTop: 8 }} />
          <Card.Actions>
            <Button 
              icon={liked ? "heart" : "heart-outline"} 
              compact 
              onPress={handleLike}
              textColor={liked ? "#E91E63" : undefined}
            >
              {likeCount > 0 ? likeCount : 'Like'}
            </Button>
            <Button icon="comment-outline" compact onPress={handleComment}>
              {commentCount > 0 ? commentCount : 'Comment'}
            </Button>
          </Card.Actions>
        </Card>
      );
    }

    // Event post
    if (item.action === 'created_event') {
      return (
        <Card style={s.card} onPress={onPress}>
          <Card.Title
            title={item.userName || 'User'}
            subtitle={`created an event • ${timeAgo(item.timestamp)}`}
            left={(props) => <Avatar.Text {...props} size={40} label={(item.userName?.[0] || 'U').toUpperCase()} />}
          />
          {item.eventCover && (
            <Card.Cover source={{ uri: item.eventCover }} style={{ marginTop: 0 }} />
          )}
          <Card.Content style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.targetName}</Text>
            {item.eventDate && (
              <View style={s.eventMeta}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>
                  {item.eventDate}
                </Text>
              </View>
            )}
            {item.eventLocation && (
              <View style={s.eventMeta}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>
                  {item.eventLocation}
                </Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button 
              icon={liked ? "heart" : "heart-outline"} 
              compact 
              onPress={handleLike}
              textColor={liked ? "#E91E63" : undefined}
            >
              {likeCount > 0 ? likeCount : 'Like'}
            </Button>
            <Button icon="comment-outline" compact onPress={handleComment}>
              {commentCount > 0 ? commentCount : 'Comment'}
            </Button>
          </Card.Actions>
        </Card>
      );
    }

    // Check-in post
    if (item.action === 'checked_in') {
      return (
        <Card style={s.card} onPress={onPress}>
          <Card.Title
            title={item.userName || 'User'}
            subtitle={`checked in at ${item.targetName} • ${timeAgo(item.timestamp)}`}
            left={(props) => <Avatar.Text {...props} size={40} label={(item.userName?.[0] || 'U').toUpperCase()} />}
          />
          {item.checkInText && (
            <Card.Content style={{ marginTop: 8 }}>
              <Text>{item.checkInText}</Text>
            </Card.Content>
          )}
          <Card.Cover source={{ uri: item.imageUrl }} style={{ marginTop: 8 }} />
          <Card.Actions>
            <Button 
              icon={liked ? "heart" : "heart-outline"} 
              compact 
              onPress={handleLike}
              textColor={liked ? "#E91E63" : undefined}
            >
              {likeCount > 0 ? likeCount : 'Like'}
            </Button>
            <Button icon="comment-outline" compact onPress={handleComment}>
              {commentCount > 0 ? commentCount : 'Comment'}
            </Button>
          </Card.Actions>
        </Card>
      );
    }

    // Simple activity (old follow/visit - should not appear anymore)
    const actionEmoji = { followed: '👥', visited: '📍' }[item.action] || '•';
    const actionText = { followed: 'followed', visited: 'visited' }[item.action] || item.action;

    return (
      <TouchableOpacity style={s.simpleItem} onPress={onPress}>
        <View style={s.simpleAvatar}>
          <Text style={{ fontSize: 20 }}>{actionEmoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text>
            <Text style={{ fontWeight: '600' }}>{item.userName || 'User'}</Text>
            {' '}{actionText}{' '}
            <Text style={{ fontWeight: '600' }}>{item.targetName}</Text>
          </Text>
          <Text style={s.simpleTime}>{timeAgo(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  } catch (error) {
    console.error('[FEED] FeedPost render error:', error, item);
    return (
      <View style={{ padding: 16, backgroundColor: '#ffcccc', borderRadius: 8 }}>
        <Text>Error rendering post</Text>
      </View>
    );
  }
}

export default function FeedScreen({ navigation }) {
  const [seeding, setSeeding] = useState(false);
  const [commentModal, setCommentModal] = useState({ visible: false, item: null });

  const { data: feedItems = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getFeedItems(50),
    staleTime: 60 * 1000,
  });

  const handleSeedFeed = async () => {
    try {
      setSeeding(true);
      const count = await seedFeedData(auth.currentUser?.uid || 'current_user');
      await refetch();
      Alert.alert('Success', `Added ${count} feed posts. Now seed Comments & Likes!`);
    } catch (error) {
      console.error('Seed error:', error);
      Alert.alert('Error', error.message || 'Failed to seed feed.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedComments = async () => {
    try {
      setSeeding(true);
      
      const { testSeedCommentsReal } = await import('../../services/testSeed');
      const count = await testSeedCommentsReal();
      
      await refetch();
      Alert.alert('Success', `Added ${count} test comments! Check Firestore.`);
    } catch (error) {
      console.error('Seed comments error:', error);
      Alert.alert('Error', error.message || 'Failed to seed comments.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedLikes = async () => {
    try {
      setSeeding(true);
      
      const { testSeedLikesReal } = await import('../../services/testSeed');
      const count = await testSeedLikesReal();
      
      await refetch();
      Alert.alert('Success', `Added ${count} test likes! Check Firestore.`);
    } catch (error) {
      console.error('Seed likes error:', error);
      Alert.alert('Error', error.message || 'Failed to seed likes.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedNotifications = async () => {
    try {
      setSeeding(true);
      
      const { seedNotifications } = await import('../../services/notificationService');
      
      // Get real Firebase Auth UID
      const realUserId = auth.currentUser?.uid;
      console.log('[FEED] Seeding notifications for real userId:', realUserId);
      
      if (!realUserId) {
        Alert.alert('Error', 'Please login first to see notifications!');
        return;
      }
      
      const count = await seedNotifications(realUserId);
      
      Alert.alert('Success', `Created ${count} notifications! Check dropdown.`);
    } catch (error) {
      console.error('Seed notifications error:', error);
      Alert.alert('Error', error.message || 'Failed to seed notifications.');
    } finally {
      setSeeding(false);
    }
  };

  const openCommentModal = (item) => {
    setCommentModal({ visible: true, item });
  };

  const closeCommentModal = () => {
    setCommentModal({ visible: false, item: null });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Activity Feed</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : feedItems.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>📰</Text>
          <Text style={s.emptyText}>No activity yet</Text>
          <Text style={s.emptyHint}>Follow users to see their activity here</Text>
          <View style={{ marginTop: 16, gap: 8 }}>
            <Button mode="contained" onPress={handleSeedFeed} loading={seeding}>
              1. Seed Feed Posts
            </Button>
            <Button mode="outlined" onPress={handleSeedComments} loading={seeding}>
              2. Seed Comments
            </Button>
            <Button mode="outlined" onPress={handleSeedLikes} loading={seeding}>
              3. Seed Likes
            </Button>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 12, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Button 
                mode="contained" 
                onPress={handleSeedFeed} 
                loading={seeding}
                compact
                style={{ flex: 1 }}
              >
                Feed
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleSeedComments} 
                loading={seeding}
                compact
                style={{ flex: 1 }}
              >
                Comments
              </Button>
              <Button 
                mode="outlined" 
                onPress={handleSeedLikes} 
                loading={seeding}
                compact
                style={{ flex: 1 }}
              >
                Likes
              </Button>
            </View>
            <Button 
              mode="outlined" 
              onPress={handleSeedNotifications} 
              loading={seeding}
              compact
              icon="bell"
            >
              Seed Notifications
            </Button>
          </View>
          <FlatList
            data={feedItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FeedPost
                item={item}
                onPress={() => {
                  if (item.targetType === 'place') {
                    navigation.navigate('Discover', {
                    screen: 'PlaceDetail',
                    params: { placeId: item.targetId },
                  });
                } else if (item.targetType === 'event') {
                  navigation.navigate('Events', {
                    screen: 'EventDetail',
                    params: { eventId: item.targetId },
                  });
                }
              }}
              onComment={openCommentModal}
            />
          )}
          contentContainerStyle={{ padding: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
        </View>
      )}

      {/* Comment Modal */}
      <CommentModal
        visible={commentModal.visible}
        onDismiss={closeCommentModal}
        feedItemId={commentModal.item?.id}
        targetType={commentModal.item?.targetType}
        targetName={commentModal.item?.targetName}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 8 },
  emptyHint: { fontSize: 13, color: '#666', textAlign: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#fff' },
  rating: { flexDirection: 'row', paddingHorizontal: 16, gap: 2 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  simpleItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  simpleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleTime: { fontSize: 12, color: '#666', marginTop: 2 },
});

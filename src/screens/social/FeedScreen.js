import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Avatar, ActivityIndicator, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getFeedItems, seedFeedData } from '../../services/feedService';
import { auth } from '../../config/firebase';
import { COLORS, SIZES } from '../../config/constants';

function FeedPost({ item, onPress }) {
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
      return 'recently';
    }
  };

  if (!item || !item.action) return null;

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
        {item.imageUrl && (
          <Card.Cover source={{ uri: item.imageUrl }} style={{ marginTop: 8 }} />
        )}
        <Card.Actions>
          <Button icon="heart-outline" compact>Like</Button>
          <Button icon="comment-outline" compact>Comment</Button>
          <Button icon="share-outline" compact>Share</Button>
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
          <Card.Cover source={{ uri: item.eventCover }} />
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
          <Button icon="heart-outline" compact>Like</Button>
          <Button icon="comment-outline" compact>Comment</Button>
          <Button icon="share-outline" compact>Share</Button>
        </Card.Actions>
      </Card>
    );
  }

  // Simple activity
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
}

export default function FeedScreen({ navigation }) {
  const [seeding, setSeeding] = useState(false);

  const { data: feedItems = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getFeedItems(50),
    staleTime: 60 * 1000,
  });

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      const count = await seedFeedData(auth.currentUser?.uid || 'current_user');
      await refetch();
      Alert.alert('Success', `Added ${count} sample feed posts`);
    } catch (error) {
      console.error('Seed error:', error);
      Alert.alert('Error', error.message || 'Failed to seed data');
    } finally {
      setSeeding(false);
    }
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
          <Button mode="contained" onPress={handleSeedData} loading={seeding} style={{ marginTop: 16 }}>
            Seed Sample Data
          </Button>
        </View>
      ) : (
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
            />
          )}
          contentContainerStyle={{ padding: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
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

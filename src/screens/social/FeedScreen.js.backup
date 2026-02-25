import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { Text, Avatar, ActivityIndicator, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getFeedItems, seedFeedData } from '../../services/feedService';
import { auth } from '../../config/firebase';
import { COLORS, SIZES } from '../../config/constants';

// Rich feed post component (like Facebook/X)
function FeedPost({ item, onPress }) {
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Review post with rating and text
  if (item.action === 'reviewed') {
    return (
      <Card style={s.card} onPress={onPress}>
        <Card.Title
          title={item.userName || 'User'}
          subtitle={`reviewed ${item.targetName} • ${timeAgo(item.timestamp)}`}
          left={(props) => <Avatar.Text {...props} size={40} label={item.userName?.[0] || 'U'} />}
        />
        {item.rating && (
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
          <Card.Content style={{ marginTop: SIZES.sm }}>
            <Text variant="bodyMedium">{item.reviewText}</Text>
          </Card.Content>
        )}
        {item.imageUrl && (
          <Card.Cover source={{ uri: item.imageUrl }} style={{ marginTop: SIZES.sm }} />
        )}
        <Card.Actions style={s.actions}>
          <Button icon="heart-outline" compact>Like</Button>
          <Button icon="comment-outline" compact>Comment</Button>
          <Button icon="share-outline" compact>Share</Button>
        </Card.Actions>
      </Card>
    );
  }

  // Event post with cover and details
  if (item.action === 'created_event') {
    return (
      <Card style={s.card} onPress={onPress}>
        <Card.Title
          title={item.userName || 'User'}
          subtitle={`created an event • ${timeAgo(item.timestamp)}`}
          left={(props) => <Avatar.Text {...props} size={40} label={item.userName?.[0] || 'U'} />}
        />
        {item.eventCover && (
          <Card.Cover source={{ uri: item.eventCover }} />
        )}
        <Card.Content style={{ marginTop: SIZES.sm }}>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>{item.targetName}</Text>
          {item.eventDate && (
            <View style={s.eventMeta}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: COLORS.textSecondary }}>
                {item.eventDate}
              </Text>
            </View>
          )}
          {item.eventLocation && (
            <View style={s.eventMeta}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text variant="bodySmall" style={{ marginLeft: 4, color: COLORS.textSecondary }}>
                {item.eventLocation}
              </Text>
            </View>
          )}
        </Card.Content>
        <Card.Actions style={s.actions}>
          <Button icon="heart-outline" compact>Like</Button>
          <Button icon="comment-outline" compact>Comment</Button>
          <Button icon="share-outline" compact>Share</Button>
        </Card.Actions>
      </Card>
    );
  }

  // Simple activity (follow, visit)
  const actionEmoji = {
    followed: '👥',
    visited: '📍',
  }[item.action] || '•';

  const actionText = {
    followed: 'followed',
    visited: 'visited',
  }[item.action] || item.action;

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
      Alert.alert('Error', error.message);
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
          <Button
            mode="contained"
            onPress={handleSeedData}
            loading={seeding}
            style={{ marginTop: SIZES.lg }}
          >
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
                } else if (item.targetType === 'user') {
                  navigation.navigate('UserProfile', { userId: item.targetId });
                }
              }}
            />
          )}
          contentContainerStyle={{ padding: SIZES.sm, gap: SIZES.sm }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.md, paddingBottom: SIZES.sm },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.sm,
    padding: SIZES.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SIZES.sm,
  },
  emptyHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.xl,
  },
  card: {
    marginBottom: SIZES.sm,
    backgroundColor: '#fff',
  },
  rating: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    gap: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  simpleItem: {
    flexDirection: 'row',
    padding: SIZES.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: SIZES.sm,
    gap: SIZES.sm,
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
  simpleTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actions: {
    paddingHorizontal: SIZES.xs,
    paddingVertical: SIZES.xs,
  },
});

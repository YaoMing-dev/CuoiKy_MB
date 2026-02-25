import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getFeedItems } from '../../services/feedService';
import { COLORS, SIZES } from '../../config/constants';

const ACTION_EMOJI = {
  reviewed: '⭐',
  created_event: '📅',
  followed: '👥',
  visited: '📍',
};

const ACTION_TEXT = {
  reviewed: 'reviewed',
  created_event: 'created event',
  followed: 'followed',
  visited: 'visited',
};

function FeedItem({ item, onPress }) {
  const emoji = ACTION_EMOJI[item.action] || '•';
  const actionText = ACTION_TEXT[item.action] || item.action;
  
  const timeAgo = (timestamp) => {
    if (!timestamp) return 'recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
      <View style={s.avatar}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={s.content}>
        <Text style={s.activityText}>
          <Text style={s.userName}>Someone</Text>
          <Text style={s.action}> {actionText} </Text>
          <Text style={s.targetName}>{item.targetName}</Text>
        </Text>
        <Text style={s.time}>{timeAgo(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen({ navigation }) {
  const { data: feedItems = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => getFeedItems(50),
    staleTime: 60 * 1000,
  });

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
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedItem
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
          ItemSeparatorComponent={() => <Divider />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[COLORS.primary]} />
          }
          contentContainerStyle={feedItems.length === 0 ? s.emptyList : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.md, paddingBottom: SIZES.sm },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SIZES.xl },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', padding: SIZES.md, backgroundColor: '#fff', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: SIZES.sm },
  content: { flex: 1 },
  activityText: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  userName: { fontWeight: '700', color: COLORS.text },
  action: { color: COLORS.textSecondary },
  targetName: { fontWeight: '600', color: COLORS.primary },
  time: { fontSize: 12, color: COLORS.textSecondary },
});

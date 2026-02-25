import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebase';
import useAuthStore from '../../stores/useAuthStore';
import { COLORS, SIZES } from '../../config/constants';

const NOTIFICATION_ICONS = {
  follow: '👥',
  review: '⭐',
  event_reminder: '📅',
  message: '💬',
  admin: '⚙️',
};

function NotificationItem({ item, onPress, onMarkRead }) {
  const icon = NOTIFICATION_ICONS[item.type] || '🔔';
  
  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <TouchableOpacity
      style={[s.item, !item.read && s.itemUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={s.iconCircle}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={s.content}>
        <Text style={s.itemTitle}>{item.title}</Text>
        <Text style={s.itemBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
      </View>
      {!item.read && (
        <TouchableOpacity onPress={onMarkRead}>
          <View style={s.unreadDot} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function NotificationScreen({ navigation }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.uid] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.uid] });
    },
  });

  const handleNotificationPress = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification data
    const { targetType, targetId } = notification.data || {};
    if (targetType === 'place' && targetId) {
      navigation.navigate('Discover', {
        screen: 'PlaceDetail',
        params: { placeId: targetId },
      });
    } else if (targetType === 'event' && targetId) {
      navigation.navigate('Events', {
        screen: 'EventDetail',
        params: { eventId: targetId },
      });
    } else if (targetType === 'user' && targetId) {
      navigation.navigate('UserProfile', { userId: targetId });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllAsReadMutation.mutate()}>
            <Text style={s.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={s.emptyText}>No notifications</Text>
          <Text style={s.emptyHint}>We'll notify you when something happens</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => handleNotificationPress(item)}
              onMarkRead={() => markAsReadMutation.mutate(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <Divider />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  markAllBtn: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.sm },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SIZES.xl },
  item: {
    flexDirection: 'row',
    padding: SIZES.md,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  itemUnread: { backgroundColor: '#F0F8FF' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  content: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  itemBody: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  itemTime: { fontSize: 11, color: COLORS.textSecondary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SIZES.sm,
  },
});

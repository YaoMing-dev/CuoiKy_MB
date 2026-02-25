import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Divider, Portal, Modal, Badge } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuthStore from '../stores/useAuthStore';
import { COLORS, SIZES } from '../config/constants';

const NOTIFICATION_ICONS = {
  follow: '👥',
  review: '⭐',
  event_reminder: '📅',
  message: '💬',
  admin: '⚙️',
};

export default function NotificationDropdown({ visible, onDismiss, onSeeAll }) {
  const { user } = useAuthStore();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-dropdown', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user && visible,
    staleTime: 30 * 1000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={s.modal}
      >
        <View style={s.dropdown}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Badge size={20} style={s.badge}>{unreadCount}</Badge>
            )}
          </View>
          <Divider />

          {/* Notification List */}
          {notifications.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 32 }}>🔔</Text>
              <Text style={s.emptyText}>No notifications</Text>
            </View>
          ) : (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {notifications.map((item) => {
                const icon = NOTIFICATION_ICONS[item.type] || '🔔';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.item, !item.read && s.itemUnread]}
                    onPress={onDismiss}
                    activeOpacity={0.7}
                  >
                    <View style={s.itemIcon}>
                      <Text style={{ fontSize: 18 }}>{icon}</Text>
                    </View>
                    <View style={s.itemContent}>
                      <Text style={s.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.itemBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={s.itemTime}>{timeAgo(item.createdAt)}</Text>
                    </View>
                    {!item.read && <View style={s.unreadDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Divider />
              <TouchableOpacity style={s.footer} onPress={onSeeAll}>
                <Text style={s.footerText}>See All Notifications</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const s = StyleSheet.create({
  modal: {
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  dropdown: {
    width: 360,
    maxHeight: 450,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.error,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    gap: SIZES.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  list: {
    maxHeight: 320,
  },
  item: {
    flexDirection: 'row',
    padding: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignItems: 'flex-start',
    gap: SIZES.sm,
  },
  itemUnread: {
    backgroundColor: '#F0F8FF',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  footer: {
    padding: SIZES.sm,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

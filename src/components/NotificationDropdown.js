import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { Divider, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { COLORS, SIZES } from '../config/constants';

export default function NotificationDropdown({ visible, onDismiss, onSeeAll }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const loadNotifs = async () => {
      try {
        setLoading(true);
        const { getNotifications } = await import('../services/notificationService');
        
        // IMPORTANT: Use real Firebase Auth UID
        const currentUserId = auth.currentUser?.uid;
        console.log('[NOTIFICATION] Current auth userId:', currentUserId);
        
        if (!currentUserId) {
          console.warn('[NOTIFICATION] No user logged in, showing empty notifications');
          setNotifications([]);
          setLoading(false);
          return;
        }
        
        console.log('[NOTIFICATION] Loading for userId:', currentUserId);
        const data = await getNotifications(currentUserId, 10);
        console.log('[NOTIFICATION] Loaded:', data.length, 'notifications');
        
        if (data.length === 0) {
          console.warn('[NOTIFICATION] No notifications found for userId:', currentUserId);
        }
        
        setNotifications(data);
      } catch (error) {
        console.error('[NOTIFICATION] Load error:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifs();
  }, [visible]);

  const getIcon = (type) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'review': return 'star';
      case 'check_in': return 'location';
      case 'event_reminder': return 'calendar';
      case 'message': return 'chatbubble';
      default: return 'notifications';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={s.dropdown} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && <Badge size={20} style={s.badge}>{unreadCount}</Badge>}
          </View>
          <Divider />

          {/* Loading state */}
          {loading && (
            <View style={s.empty}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={s.emptyText}>Loading...</Text>
            </View>
          )}

          {/* Empty state */}
          {!loading && notifications.length === 0 && (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text style={s.emptyText}>No notifications</Text>
            </View>
          )}

          {/* Notification list */}
          {!loading && notifications.length > 0 && (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {notifications.map((item) => {
                const timeAgo = item.createdAt
                  ? Math.floor((Date.now() - item.createdAt.toMillis()) / 60000)
                  : 0;
                const timeLabel =
                  timeAgo < 1 ? 'just now' :
                  timeAgo < 60 ? `${timeAgo}m` :
                  timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h` :
                  `${Math.floor(timeAgo / 1440)}d`;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.item, !item.isRead && s.itemUnread]}
                    onPress={() => {
                      // TODO: Mark as read & navigate
                      onDismiss();
                    }}
                  >
                    <View style={s.itemIcon}>
                      <Ionicons name={getIcon(item.type)} size={18} color={COLORS.primary} />
                    </View>
                    <View style={s.itemContent}>
                      <Text style={s.itemTitle}>
                        <Text style={{ fontWeight: '600' }}>{item.actorName}</Text>
                        {' '}{item.message}
                      </Text>
                      {item.preview && (
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }} numberOfLines={1}>
                          "{item.preview}"
                        </Text>
                      )}
                      <Text style={s.itemTime}>{timeLabel}</Text>
                    </View>
                    {!item.isRead && <View style={s.unreadDot} />}
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
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingTop: 60, // Space below header
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  dropdown: {
    width: 360,
    maxWidth: '90%',
    minHeight: 200, // Ensure dropdown has minimum height
    maxHeight: 450,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    padding: SIZES.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

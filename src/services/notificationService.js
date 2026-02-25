import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { collection, addDoc, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Register for push notifications ──────────────────────────────────────────
export const registerForPushNotifications = async () => {
  try {
    // Skip push notifications on web
    if (Platform.OS === 'web') {
      console.log('[PUSH] Push notifications not supported on web, skipping...');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// ── Save notification to Firestore ────────────────────────────────────────────
export const saveNotification = async (userId, notificationData) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving notification:', error);
  }
};

// ── Send push notification (via Expo Push API) ────────────────────────────────
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send push notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

// ── Schedule local notification ───────────────────────────────────────────────
export const scheduleLocalNotification = async (title, body, trigger = null) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: trigger || { seconds: 1 },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

// ── Listen to notification responses ──────────────────────────────────────────
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// ── Listen to foreground notifications ────────────────────────────────────────
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// ══════════════════════════════════════════════════════════════════════════════
// FIRESTORE NOTIFICATIONS (Real notification feed)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Seed notifications based on real feed/comments/likes data
 */
export const seedNotifications = async (targetUserId) => {
  try {
    console.log('[NOTIFICATION] 🔔 Starting notification seeding for userId:', targetUserId);
    
    // Get all feed posts
    const feedSnap = await getDocs(collection(db, 'feed'));
    const feedItems = feedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[NOTIFICATION] Found ${feedItems.length} feed posts`);
    
    if (feedItems.length === 0) {
      console.warn('[NOTIFICATION] No feed posts found. Seed feed first!');
      return 0;
    }
    
    // Get all comments
    const commentsSnap = await getDocs(collection(db, 'comments'));
    const comments = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[NOTIFICATION] Found ${comments.length} comments`);
    
    // Get all likes
    const likesSnap = await getDocs(collection(db, 'likes'));
    const likes = likesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`[NOTIFICATION] Found ${likes.length} likes`);
    
    const notifications = [];
    
    // Sample users for actors
    const sampleUsers = [
      { id: 'anna_nguyen', name: 'Anna Nguyen' },
      { id: 'john_smith', name: 'John Smith' },
      { id: 'linh_tran', name: 'Linh Tran' },
      { id: 'mike_chen', name: 'Mike Chen' },
      { id: 'emily_pham', name: 'Emily Pham' },
      { id: 'david_le', name: 'David Le' },
      { id: 'sarah_vo', name: 'Sarah Vo' },
      { id: 'tom_nguyen', name: 'Tom Nguyen' },
    ];
    
    // 1. Create notifications: Others commented on YOUR posts
    // Find posts from target user or create fake posts for them
    const userPosts = feedItems.filter(f => f.userId === targetUserId);
    console.log(`[NOTIFICATION] Target user has ${userPosts.length} posts`);
    
    // If user has no posts, create fake notifications for random posts
    const postsToNotify = userPosts.length > 0 
      ? userPosts.slice(0, 5) 
      : feedItems.slice(0, 5);
    
    for (const post of postsToNotify) {
      // 2-4 random users commented on this post
      const numComments = Math.floor(Math.random() * 3) + 2;
      const actors = sampleUsers.sort(() => 0.5 - Math.random()).slice(0, numComments);
      
      for (const actor of actors) {
        notifications.push({
          userId: targetUserId, // Notification for target user
          type: 'comment',
          actorId: actor.id,
          actorName: actor.name,
          targetType: 'feed_post',
          targetId: post.id,
          targetName: post.targetName || 'your post',
          message: `commented on your post about ${post.targetName || 'a place'}`,
          preview: comments[Math.floor(Math.random() * Math.min(10, comments.length))]?.text || 'Great place!',
          isRead: Math.random() > 0.6, // 40% unread
          createdAt: serverTimestamp(),
        });
      }
    }
    
    // 2. Create notifications: Others liked YOUR posts
    for (const post of postsToNotify) {
      // 3-8 random users liked this post
      const numLikes = Math.floor(Math.random() * 6) + 3;
      const likers = sampleUsers.sort(() => 0.5 - Math.random()).slice(0, numLikes);
      
      for (const liker of likers) {
        notifications.push({
          userId: targetUserId,
          type: 'like',
          actorId: liker.id,
          actorName: liker.name,
          targetType: 'feed_post',
          targetId: post.id,
          targetName: post.targetName || 'your post',
          message: `liked your post about ${post.targetName || 'a place'}`,
          isRead: Math.random() > 0.4, // 60% unread
          createdAt: serverTimestamp(),
        });
      }
    }
    
    // 3. Create notifications: New followers
    const numFollowers = Math.floor(Math.random() * 4) + 3; // 3-6 followers
    const followers = sampleUsers.sort(() => 0.5 - Math.random()).slice(0, numFollowers);
    
    for (const follower of followers) {
      notifications.push({
        userId: targetUserId,
        type: 'follow',
        actorId: follower.id,
        actorName: follower.name,
        targetType: 'user',
        targetId: targetUserId,
        message: 'started following you',
        isRead: Math.random() > 0.5,
        createdAt: serverTimestamp(),
      });
    }
    
    console.log(`[NOTIFICATION] Created ${notifications.length} notification objects`);
    
    // Save to Firestore
    let saved = 0;
    for (const notif of notifications) {
      await addDoc(collection(db, 'notifications'), notif);
      saved++;
      if (saved % 10 === 0) {
        console.log(`[NOTIFICATION] Saved ${saved}/${notifications.length}...`);
      }
    }
    
    console.log(`[NOTIFICATION] ✅ Saved ${saved} notifications to Firestore for userId: ${targetUserId}`);
    return saved;
    
  } catch (error) {
    console.error('[NOTIFICATION] ❌ Error seeding notifications:', error);
    throw error;
  }
};

/**
 * Get notifications for a specific user
 */
export const getNotifications = async (userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by createdAt in memory
    notifications.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.() || new Date(0);
      const timeB = b.createdAt?.toDate?.() || new Date(0);
      return timeB - timeA;
    });
    
    return notifications;
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

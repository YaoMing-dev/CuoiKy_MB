import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Create feed item ──────────────────────────────────────────────────────────
export const createFeedItem = async (userId, action, targetType, targetId, targetName) => {
  try {
    await addDoc(collection(db, 'feed'), {
      userId,
      action, // 'reviewed', 'created_event', 'followed', 'visited'
      targetType, // 'place', 'event', 'user'
      targetId,
      targetName,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating feed item:', error);
  }
};

// ── Get feed items ────────────────────────────────────────────────────────────
export const getFeedItems = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'feed'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting feed items:', error);
    return [];
  }
};

// ── Get user's feed (following users) ─────────────────────────────────────────
export const getUserFeed = async (userId, limitCount = 50) => {
  try {
    // In a real app, you'd query based on users the current user is following
    // For now, get all recent feed items
    return await getFeedItems(limitCount);
  } catch (error) {
    console.error('Error getting user feed:', error);
    return [];
  }
};

// ── Seed sample feed data ──────────────────────────────────────────────────────
export const seedFeedData = async (currentUserId) => {
  try {
    const sampleActivities = [
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'reviewed',
        targetType: 'place',
        targetId: 'place_1',
        targetName: 'Ben Thanh Market',
      },
      {
        userId: 'user_john',
        userName: 'John Smith',
        action: 'created_event',
        targetType: 'event',
        targetId: 'event_1',
        targetName: 'Street Food Tour',
      },
      {
        userId: 'user_linh',
        userName: 'Linh Tran',
        action: 'visited',
        targetType: 'place',
        targetId: 'place_2',
        targetName: 'Hoi An Ancient Town',
      },
      {
        userId: 'user_mike',
        userName: 'Mike Chen',
        action: 'followed',
        targetType: 'user',
        targetId: currentUserId,
        targetName: 'You',
      },
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'created_event',
        targetType: 'event',
        targetId: 'event_2',
        targetName: 'Beach Volleyball Tournament',
      },
    ];

    for (const activity of sampleActivities) {
      await addDoc(collection(db, 'feed'), {
        ...activity,
        timestamp: serverTimestamp(),
      });
    }

    return sampleActivities.length;
  } catch (error) {
    console.error('Error seeding feed data:', error);
    throw error;
  }
};


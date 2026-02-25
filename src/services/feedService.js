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
      // Review post with rating and text
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'reviewed',
        targetType: 'place',
        targetId: 'place_benthanhmarket', // Sync with actual seeded places
        targetName: 'Ben Thanh Market',
        rating: 5,
        reviewText: 'Amazing local experience! The vendors are so friendly and the food is absolutely delicious. Must-visit when in Saigon! 🇻🇳',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      },
      // Event post with details
      {
        userId: 'user_john',
        userName: 'John Smith',
        action: 'created_event',
        targetType: 'event',
        targetId: 'event_foodfestival',
        targetName: 'Saigon Street Food Festival',
        eventCover: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        eventDate: 'Th 7, 28/02/2026',
        eventLocation: 'Ho Chi Minh City',
      },
      // Review with high rating
      {
        userId: 'user_linh',
        userName: 'Linh Tran',
        action: 'reviewed',
        targetType: 'place',
        targetId: 'place_hoian',
        targetName: 'Hoi An Ancient Town',
        rating: 5,
        reviewText: 'Magical lanterns at night! 🏮 The architecture is stunning and the atmosphere is so peaceful. Perfect for photography lovers!',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      },
      // Simple follow activity
      {
        userId: 'user_mike',
        userName: 'Mike Chen',
        action: 'followed',
        targetType: 'user',
        targetId: currentUserId,
        targetName: 'You',
      },
      // Event post
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'created_event',
        targetType: 'event',
        targetId: 'event_volleyball',
        targetName: 'Beach Volleyball Tournament',
        eventCover: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
        eventDate: 'Sat 1, 01/03/2026',
        eventLocation: 'Nha Trang Beach',
      },
      // Review with photo
      {
        userId: 'user_david',
        userName: 'David Le',
        action: 'reviewed',
        targetType: 'place',
        targetId: 'place_halong',
        targetName: 'Ha Long Bay',
        rating: 5,
        reviewText: 'Breathtaking scenery! The cruise was incredible and the limestone karsts are even more beautiful in person. Worth every penny! ⛵️',
        imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      },
      // Simple visit
      {
        userId: 'user_emily',
        userName: 'Emily Pham',
        action: 'visited',
        targetType: 'place',
        targetId: 'place_dalat',
        targetName: 'Da Lat City',
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


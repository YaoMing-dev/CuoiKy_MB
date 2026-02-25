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
    console.log('[FEED] Starting seed...');
    
    // Get real places and events from Firestore
    const placesSnap = await getDocs(collection(db, 'places'));
    const eventsSnap = await getDocs(collection(db, 'events'));
    
    const places = placesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`[FEED] Found ${places.length} places, ${events.length} events`);

    if (places.length === 0 || events.length === 0) {
      throw new Error('Please seed Places and Events first!');
    }

    // Use first available items - simpler approach
    const place1 = places[0];
    const place2 = places[1] || places[0];
    const event1 = events[0];
    const event2 = events[1] || events[0];

    console.log('[FEED] Using:', {
      place1: place1.name,
      place2: place2.name,
      event1: event1.title,
      event2: event2.title
    });

    const sampleActivities = [
      // Simple review - minimal data
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'reviewed',
        targetType: 'place',
        targetId: place1.id,
        targetName: place1.name,
        rating: 5,
        reviewText: 'Amazing place! Highly recommend visiting! 🌟',
        imageUrl: place1.imageUrl || place1.coverImage || 'https://via.placeholder.com/400',
      },
      // Simple event
      {
        userId: 'user_john',
        userName: 'John Smith',
        action: 'created_event',
        targetType: 'event',
        targetId: event1.id,
        targetName: event1.title,
        eventCover: event1.coverImage || event1.imageUrl || 'https://via.placeholder.com/400',
        eventDate: event1.date ? new Date(event1.date.seconds * 1000).toLocaleDateString() : 'TBA',
        eventLocation: event1.city,
      },
      // Another review
      {
        userId: 'user_linh',
        userName: 'Linh Tran',
        action: 'reviewed',
        targetType: 'place',
        targetId: place2.id,
        targetName: place2.name,
        rating: 4,
        reviewText: 'Great experience! Will come back again.',
        imageUrl: place2.imageUrl || place2.coverImage || 'https://via.placeholder.com/400',
      },
      // Simple follow
      {
        userId: 'user_mike',
        userName: 'Mike Chen',
        action: 'followed',
        targetType: 'user',
        targetId: currentUserId,
        targetName: 'You',
      },
      // Another event
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'created_event',
        targetType: 'event',
        targetId: event2.id,
        targetName: event2.title,
        eventCover: event2.coverImage || event2.imageUrl || 'https://via.placeholder.com/400',
        eventDate: event2.date ? new Date(event2.date.seconds * 1000).toLocaleDateString() : 'TBA',
        eventLocation: event2.city,
      },
    ];

    console.log('[FEED] Creating activities:', sampleActivities.length);

    for (const activity of sampleActivities) {
      console.log('[FEED] Adding:', activity.action, activity.targetName);
      await addDoc(collection(db, 'feed'), {
        ...activity,
        timestamp: serverTimestamp(),
      });
    }

    console.log(`[FEED] Successfully seeded ${sampleActivities.length} posts`);
    return sampleActivities.length;
  } catch (error) {
    console.error('[FEED] Error seeding:', error);
    throw error;
  }
};


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

    // Find specific places/events or use first available
    const benThanh = places.find(p => p.name?.includes('Ben Thanh')) || places[0];
    const hoiAn = places.find(p => p.name?.includes('Hoi An')) || places[1] || places[0];
    const haLong = places.find(p => p.name?.includes('Ha Long')) || places[2] || places[0];
    const daLat = places.find(p => p.city?.includes('Da Lat')) || places[3] || places[0];
    
    const foodEvent = events.find(e => e.category === 'food') || events[0];
    const sportsEvent = events.find(e => e.category === 'sports') || events[1] || events[0];

    console.log('[FEED] Using places:', benThanh?.name, hoiAn?.name);
    console.log('[FEED] Using events:', foodEvent?.title, sportsEvent?.title);

    const sampleActivities = [
      // Review post with rating and text
      {
        userId: 'user_anna',
        userName: 'Anna Nguyen',
        action: 'reviewed',
        targetType: 'place',
        targetId: benThanh?.id || 'place_1',
        targetName: benThanh?.name || 'Ben Thanh Market',
        rating: 5,
        reviewText: 'Amazing local experience! The vendors are so friendly and the food is absolutely delicious. Must-visit when in Saigon! 🇻🇳',
        imageUrl: benThanh?.imageUrl || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
      },
      // Event post with details
      {
        userId: 'user_john',
        userName: 'John Smith',
        action: 'created_event',
        targetType: 'event',
        targetId: foodEvent?.id || 'event_1',
        targetName: foodEvent?.title || 'Saigon Street Food Festival',
        eventCover: foodEvent?.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        eventDate: foodEvent?.date || 'Th 7, 28/02/2026',
        eventLocation: foodEvent?.city || 'Ho Chi Minh City',
      },
      // Review with high rating
      {
        userId: 'user_linh',
        userName: 'Linh Tran',
        action: 'reviewed',
        targetType: 'place',
        targetId: hoiAn?.id || 'place_2',
        targetName: hoiAn?.name || 'Hoi An Ancient Town',
        rating: 5,
        reviewText: 'Magical lanterns at night! 🏮 The architecture is stunning and the atmosphere is so peaceful. Perfect for photography lovers!',
        imageUrl: hoiAn?.imageUrl || 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
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
        targetId: sportsEvent?.id || 'event_2',
        targetName: sportsEvent?.title || 'Beach Volleyball Tournament',
        eventCover: sportsEvent?.imageUrl || 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
        eventDate: sportsEvent?.date || 'Sat 1, 01/03/2026',
        eventLocation: sportsEvent?.city || 'Nha Trang Beach',
      },
      // Review with photo
      {
        userId: 'user_david',
        userName: 'David Le',
        action: 'reviewed',
        targetType: 'place',
        targetId: haLong?.id || 'place_3',
        targetName: haLong?.name || 'Ha Long Bay',
        rating: 5,
        reviewText: 'Breathtaking scenery! The cruise was incredible and the limestone karsts are even more beautiful in person. Worth every penny! ⛵️',
        imageUrl: haLong?.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      },
      // Simple visit
      {
        userId: 'user_emily',
        userName: 'Emily Pham',
        action: 'visited',
        targetType: 'place',
        targetId: daLat?.id || 'place_4',
        targetName: daLat?.name || 'Da Lat City',
      },
    ];

    for (const activity of sampleActivities) {
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


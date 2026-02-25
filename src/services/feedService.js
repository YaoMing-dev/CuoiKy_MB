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

    // Helper to get random items
    const getRandomPlaces = (count) => {
      const shuffled = [...places].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, places.length));
    };

    const getRandomEvents = (count) => {
      const shuffled = [...events].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, events.length));
    };

    const randomPlaces = getRandomPlaces(10);
    const randomEvents = getRandomEvents(6);

    const users = [
      { id: 'anna', name: 'Anna Nguyen' },
      { id: 'john', name: 'John Smith' },
      { id: 'linh', name: 'Linh Tran' },
      { id: 'mike', name: 'Mike Chen' },
      { id: 'emily', name: 'Emily Pham' },
      { id: 'david', name: 'David Le' },
      { id: 'sarah', name: 'Sarah Vo' },
      { id: 'tom', name: 'Tom Nguyen' },
    ];

    const reviewTexts = [
      { stars: 5, text: 'Absolutely amazing! One of the best experiences in Vietnam. Highly recommend! 🌟' },
      { stars: 5, text: 'Perfect place! Great atmosphere, friendly staff, and beautiful surroundings. Will definitely come back! ❤️' },
      { stars: 4, text: 'Really enjoyed my visit here. Good food, nice views. Worth checking out! 👍' },
      { stars: 5, text: 'Incredible experience! Everything was perfect from start to finish. Don\'t miss this! ✨' },
      { stars: 4, text: 'Lovely place with great vibes. A bit crowded but totally worth it. 😊' },
      { stars: 5, text: 'Exceeded all expectations! Beautiful location and wonderful memories made here. 🎉' },
      { stars: 4, text: 'Great spot! Would recommend to anyone visiting the area. Good value too. 💯' },
      { stars: 5, text: 'Magical experience! The photos don\'t do it justice. You have to see it yourself! 📸' },
    ];

    const sampleActivities = [];

    // Add diverse review posts (8 reviews)
    for (let i = 0; i < 8 && i < randomPlaces.length; i++) {
      const place = randomPlaces[i];
      const user = users[i % users.length];
      const review = reviewTexts[i % reviewTexts.length];
      
      sampleActivities.push({
        userId: user.id,
        userName: user.name,
        action: 'reviewed',
        targetType: 'place',
        targetId: place.id,
        targetName: place.name,
        rating: review.stars,
        reviewText: review.text,
        imageUrl: place.imageUrl || place.coverImage || 'https://via.placeholder.com/400',
        likeCount: Math.floor(Math.random() * 50) + 5,
        commentCount: Math.floor(Math.random() * 20),
      });
    }

    // Add event creation posts (6 events)
    for (let i = 0; i < 6 && i < randomEvents.length; i++) {
      const event = randomEvents[i];
      const user = users[(i + 2) % users.length];
      
      sampleActivities.push({
        userId: user.id,
        userName: user.name,
        action: 'created_event',
        targetType: 'event',
        targetId: event.id,
        targetName: event.title,
        eventCover: event.coverImage || event.imageUrl || 'https://via.placeholder.com/400',
        eventDate: event.date ? new Date(event.date.seconds * 1000).toLocaleDateString('vi-VN') : 'TBA',
        eventLocation: event.city,
        likeCount: Math.floor(Math.random() * 80) + 10,
        commentCount: Math.floor(Math.random() * 30),
      });
    }

    // Add visit activities (4 visits)
    for (let i = 8; i < 12 && i < randomPlaces.length; i++) {
      const place = randomPlaces[i % randomPlaces.length];
      const user = users[(i + 4) % users.length];
      
      sampleActivities.push({
        userId: user.id,
        userName: user.name,
        action: 'visited',
        targetType: 'place',
        targetId: place.id,
        targetName: place.name,
      });
    }

    // Add follow activities (3 follows)
    for (let i = 0; i < 3; i++) {
      const user = users[(i + 5) % users.length];
      sampleActivities.push({
        userId: user.id,
        userName: user.name,
        action: 'followed',
        targetType: 'user',
        targetId: currentUserId,
        targetName: 'You',
      });
    }

    // Shuffle activities to mix post types
    const shuffled = sampleActivities.sort(() => 0.5 - Math.random());

    console.log(`[FEED] Creating ${shuffled.length} activities...`);

    for (const activity of shuffled) {
      console.log('[FEED] Adding:', activity.action, activity.targetName);
      await addDoc(collection(db, 'feed'), {
        ...activity,
        timestamp: serverTimestamp(),
      });
    }

    console.log(`[FEED] Successfully seeded ${shuffled.length} posts`);
    return shuffled.length;
  } catch (error) {
    console.error('[FEED] Error seeding:', error);
    throw error;
  }
};


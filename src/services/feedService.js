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

// ── Seed sample comments for feed posts ────────────────────────────────────
export const seedCommentsForFeed = async (feedItems) => {
  try {
    console.log(`[FEED] 📝 Seeding comments for ${feedItems.length} posts...`);
    
    if (!feedItems || feedItems.length === 0) {
      console.warn('[FEED] ⚠️ No feed items to seed comments for!');
      return 0;
    }
    
    const users = [
      'Anna Nguyen', 'John Smith', 'Linh Tran', 'Mike Chen',
      'Emily Pham', 'David Le', 'Sarah Vo', 'Tom Nguyen'
    ];

    const commentTexts = [
      'This looks amazing! 😍',
      'I want to go here too!',
      'Thanks for sharing! Very helpful.',
      'Beautiful place! 🌟',
      'Added to my bucket list! 📝',
      'Great recommendation!',
      'When did you visit?',
      'How much did it cost?',
      'Is it worth visiting? 🤔',
      'Looks incredible! Thanks for the tip! 🙌',
    ];

    let totalComments = 0;

    for (const feedItem of feedItems) {
      // Only add comments to review posts
      if (feedItem.action !== 'reviewed') {
        console.log(`[FEED] Skipping comments for ${feedItem.action} activity`);
        continue;
      }

      // Random 1-8 comments per post (guaranteed at least 1)
      const numComments = Math.floor(Math.random() * 8) + 1;
      console.log(`[FEED] Adding ${numComments} comments to feedItem ${feedItem.id}`);
      
      for (let i = 0; i < numComments; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        
        await addDoc(collection(db, 'comments'), {
          feedItemId: feedItem.id,
          targetType: feedItem.targetType,
          userId: user.toLowerCase().replace(' ', '_'),
          userName: user,
          text,
          createdAt: serverTimestamp(),
        });
        
        totalComments++;
      }
    }

    console.log(`[FEED] ✅ Created ${totalComments} real comments in 'comments' collection`);
    return totalComments;
  } catch (error) {
    console.error('[FEED] ❌ Error seeding comments:', error);
    throw error;
  }
};

export const seedLikesForFeed = async (feedItems) => {
  try {
    console.log(`[FEED] ❤️ Seeding likes for ${feedItems.length} posts...`);
    
    if (!feedItems || feedItems.length === 0) {
      console.warn('[FEED] ⚠️ No feed items to seed likes for!');
      return 0;
    }
    
    const users = [
      'anna_nguyen', 'john_smith', 'linh_tran', 'mike_chen',
      'emily_pham', 'david_le', 'sarah_vo', 'tom_nguyen',
      'peter_vo', 'lisa_pham', 'kevin_tran', 'jenny_nguyen'
    ];

    let totalLikes = 0;

    for (const feedItem of feedItems) {
      // Skip follow activities
      if (feedItem.action === 'followed') {
        console.log(`[FEED] Skipping likes for followed activity`);
        continue;
      }

      // Random 2-15 likes per post (more realistic)
      const numLikes = Math.floor(Math.random() * 14) + 2;
      console.log(`[FEED] Adding ${numLikes} likes to feedItem ${feedItem.id}`);
      
      // Shuffle users and pick unique ones
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const likingUsers = shuffledUsers.slice(0, Math.min(numLikes, users.length));
      
      for (const userId of likingUsers) {
        await addDoc(collection(db, 'likes'), {
          feedItemId: feedItem.id,
          userId,
          createdAt: serverTimestamp(),
        });
        
        totalLikes++;
      }
    }

    console.log(`[FEED] ✅ Created ${totalLikes} real likes in 'likes' collection`);
    return totalLikes;
  } catch (error) {
    console.error('[FEED] ❌ Error seeding likes:', error);
    throw error;
  }
};
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

    // VALIDATION: Log all IDs to verify they exist
    console.log('[FEED] Place IDs:', places.map(p => p.id).join(', '));
    console.log('[FEED] Event IDs:', events.map(e => e.id).join(', '));

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

    // VALIDATION: Verify selected items
    console.log('[FEED] Selected places for feed:');
    randomPlaces.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
    console.log('[FEED] Selected events for feed:');
    randomEvents.forEach(e => console.log(`  - ${e.id}: ${e.title}`));

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

    // Add diverse review posts (10 reviews) - Main feed content
    for (let i = 0; i < 10 && i < randomPlaces.length; i++) {
      const place = randomPlaces[i];
      const user = users[i % users.length];
      const review = reviewTexts[i % reviewTexts.length];
      
      // VALIDATION: Ensure required fields exist
      if (!place.id || !place.name) {
        console.error('[FEED] Invalid place data:', place);
        continue;
      }

      const activity = {
        userId: user.id,
        userName: user.name,
        action: 'reviewed',
        targetType: 'place',
        targetId: place.id, // REAL ID from Firestore
        targetName: place.name,
        rating: review.stars,
        reviewText: review.text,
        imageUrl: place.imageUrl || place.coverImage || 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800',
      };
      
      console.log(`[FEED] Review will use placeId: ${activity.targetId}`);
      sampleActivities.push(activity);
    }

    // Add check-in posts (5 check-ins) - Like Facebook check-ins
    const checkInTexts = [
      'Feeling great here! 😊',
      'Having an amazing time! 🎉',
      'What a beautiful day! ☀️',
      'Love this place! ❤️',
      'Just checked in! 📍',
    ];

    // Different Unsplash placeholder images for variety
    const placeholderImages = [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', // Mountain
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800', // Beach
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', // Lake
      'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?w=800', // Sunset
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', // Travel
    ];

    for (let i = 0; i < 5 && i < randomPlaces.length; i++) {
      const place = randomPlaces[(i + 5) % randomPlaces.length];
      const user = users[(i + 3) % users.length];
      
      if (!place.id || !place.name) continue;
      
      const checkInPost = {
        userId: user.id,
        userName: user.name,
        action: 'checked_in',
        targetType: 'place',
        targetId: place.id,
        targetName: place.name,
        checkInText: checkInTexts[i % checkInTexts.length],
        imageUrl: place.imageUrl || place.coverImage || placeholderImages[i % placeholderImages.length],
      };
      
      sampleActivities.push(checkInPost);
    }

    // Shuffle activities to mix post types
    const shuffled = sampleActivities.sort(() => 0.5 - Math.random());

    console.log(`[FEED] ✅ VALIDATION PASSED! Creating ${shuffled.length} activities...`);
    console.log(`[FEED] All targetIds are REAL Firestore IDs - navigation will work!`);

    const createdFeedItems = [];

    for (const activity of shuffled) {
      console.log(`[FEED] Adding: ${activity.action} → ${activity.targetType} → ${activity.targetId}`);
      
      // Remove fake commentCount/likeCount and undefined fields
      const { commentCount, likeCount, ...cleanActivity } = activity;
      
      // Filter out undefined values
      const validActivity = Object.fromEntries(
        Object.entries(cleanActivity).filter(([_, v]) => v !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'feed'), {
        ...validActivity,
        timestamp: serverTimestamp(),
      });
      
      createdFeedItems.push({ id: docRef.id, ...validActivity });
    }

    console.log(`[FEED] ✅ Successfully seeded ${shuffled.length} feed posts`);
    console.log(`[FEED] ✅✅✅ FEED POSTS DONE! Now click "Seed Comments" and "Seed Likes" buttons!`);
    return shuffled.length;
  } catch (error) {
    console.error('[FEED] Error seeding:', error);
    throw error;
  }
};


import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Test: Tạo 1 comment trực tiếp
export const testCreateComment = async () => {
  console.log('[TEST] Creating test comment...');
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      feedItemId: 'test_feed_id_123',
      targetType: 'place',
      userId: 'test_user',
      userName: 'Test User',
      text: 'This is a test comment! 🎉',
      createdAt: serverTimestamp(),
    });
    console.log('[TEST] ✅ Comment created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[TEST] ❌ Error creating comment:', error);
    throw error;
  }
};

// Test: Tạo 1 like trực tiếp
export const testCreateLike = async () => {
  console.log('[TEST] Creating test like...');
  try {
    const docRef = await addDoc(collection(db, 'likes'), {
      feedItemId: 'test_feed_id_123',
      userId: 'test_user',
      createdAt: serverTimestamp(),
    });
    console.log('[TEST] ✅ Like created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[TEST] ❌ Error creating like:', error);
    throw error;
  }
};

// Test: Seed comments cho feed items thật
export const testSeedCommentsReal = async () => {
  console.log('[TEST] Getting feed items from Firestore...');
  try {
    const feedSnapshot = await getDocs(collection(db, 'feed'));
    console.log('[TEST] Found feed items:', feedSnapshot.docs.length);
    
    if (feedSnapshot.docs.length === 0) {
      console.warn('[TEST] ⚠️ No feed items found!');
      return 0;
    }
    
    const feedItems = feedSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    console.log('[TEST] Feed items:', feedItems.map(i => ({ id: i.id, action: i.action })));
    
    let count = 0;
    for (const item of feedItems) {
      if (item.action === 'followed' || item.action === 'visited') continue;
      
      console.log(`[TEST] Creating 2 comments for feed ${item.id}...`);
      
      // Tạo 2 comments cho mỗi post
      for (let i = 0; i < 2; i++) {
        const docRef = await addDoc(collection(db, 'comments'), {
          feedItemId: item.id,
          targetType: item.targetType || 'place',
          userId: `test_user_${i}`,
          userName: `Test User ${i}`,
          text: `Test comment ${i + 1}`,
          createdAt: serverTimestamp(),
        });
        console.log(`[TEST] Comment ${i + 1} created:`, docRef.id);
        count++;
      }
    }
    
    console.log(`[TEST] ✅ Created ${count} comments total`);
    return count;
  } catch (error) {
    console.error('[TEST] ❌ Error:', error);
    throw error;
  }
};

// Test: Seed likes cho feed items thật
export const testSeedLikesReal = async () => {
  console.log('[TEST] Getting feed items from Firestore...');
  try {
    const feedSnapshot = await getDocs(collection(db, 'feed'));
    console.log('[TEST] Found feed items:', feedSnapshot.docs.length);
    
    if (feedSnapshot.docs.length === 0) {
      console.warn('[TEST] ⚠️ No feed items found!');
      return 0;
    }
    
    const feedItems = feedSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    console.log('[TEST] Feed items:', feedItems.map(i => ({ id: i.id, action: i.action })));
    
    let count = 0;
    for (const item of feedItems) {
      console.log(`[TEST] Creating 3 likes for feed ${item.id}...`);
      
      // Tạo 3 likes cho mỗi post
      for (let i = 0; i < 3; i++) {
        const docRef = await addDoc(collection(db, 'likes'), {
          feedItemId: item.id,
          userId: `test_user_${i}`,
          createdAt: serverTimestamp(),
        });
        console.log(`[TEST] Like ${i + 1} created:`, docRef.id);
        count++;
      }
    }
    
    console.log(`[TEST] ✅ Created ${count} likes total`);
    return count;
  } catch (error) {
    console.error('[TEST] ❌ Error:', error);
    throw error;
  }
};

import {
  doc, getDoc, updateDoc, setDoc, deleteDoc,
  collection, query, where, getDocs,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Get user profile ──────────────────────────────────────────────────────────
export const getUserProfile = async (userId) => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// ── Follow user ───────────────────────────────────────────────────────────────
export const followUser = async (currentUserId, targetUserId) => {
  try {
    // Add to current user's following
    await setDoc(doc(db, 'users', currentUserId, 'following', targetUserId), {
      followedAt: serverTimestamp(),
    });

    // Add to target user's followers
    await setDoc(doc(db, 'users', targetUserId, 'followers', currentUserId), {
      followedAt: serverTimestamp(),
    });

    // Update counts
    await updateDoc(doc(db, 'users', currentUserId), {
      followingCount: increment(1),
    });
    await updateDoc(doc(db, 'users', targetUserId), {
      followersCount: increment(1),
    });
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// ── Unfollow user ─────────────────────────────────────────────────────────────
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUserId));

    await updateDoc(doc(db, 'users', currentUserId), {
      followingCount: increment(-1),
    });
    await updateDoc(doc(db, 'users', targetUserId), {
      followersCount: increment(-1),
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// ── Check if following ────────────────────────────────────────────────────────
export const isFollowing = async (currentUserId, targetUserId) => {
  try {
    const snap = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
    return snap.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

// ── Get user's reviews ────────────────────────────────────────────────────────
export const getUserReviews = async (userId) => {
  try {
    const q = query(collection(db, 'reviews'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return [];
  }
};

// ── Get user's events ─────────────────────────────────────────────────────────
export const getUserEvents = async (userId) => {
  try {
    const q = query(collection(db, 'events'), where('organizerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user events:', error);
    return [];
  }
};

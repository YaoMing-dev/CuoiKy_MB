import {
  collection, query, where, orderBy,
  getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const docToItinerary = (d) => ({ id: d.id, ...d.data() });

// ── Get user's itineraries ────────────────────────────────────────────────────
export const getMyItineraries = async (userId) => {
  const snapshot = await getDocs(
    query(
      collection(db, 'itineraries'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map(docToItinerary);
};

// ── Get single itinerary ──────────────────────────────────────────────────────
export const getItineraryById = async (id) => {
  const snap = await getDoc(doc(db, 'itineraries', id));
  return snap.exists() ? docToItinerary(snap) : null;
};

// ── Create itinerary ──────────────────────────────────────────────────────────
export const createItinerary = async (data) => {
  const ref = await addDoc(collection(db, 'itineraries'), {
    ...data,
    places: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// ── Update itinerary ──────────────────────────────────────────────────────────
export const updateItinerary = async (id, data) => {
  await updateDoc(doc(db, 'itineraries', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// ── Add place to itinerary ────────────────────────────────────────────────────
export const addPlaceToItinerary = async (itineraryId, placeData) => {
  await updateDoc(doc(db, 'itineraries', itineraryId), {
    places: arrayUnion(placeData),
    updatedAt: serverTimestamp(),
  });
};

// ── Remove place from itinerary ───────────────────────────────────────────────
export const removePlaceFromItinerary = async (itineraryId, placeData) => {
  await updateDoc(doc(db, 'itineraries', itineraryId), {
    places: arrayRemove(placeData),
    updatedAt: serverTimestamp(),
  });
};

// ── Delete itinerary ──────────────────────────────────────────────────────────
export const deleteItinerary = async (id) => {
  await deleteDoc(doc(db, 'itineraries', id));
};

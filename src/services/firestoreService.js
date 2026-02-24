import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, getDoc, doc, writeBatch, serverTimestamp, GeoPoint,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SEED_PLACES } from '../data/seedPlaces';

const PAGE_SIZE = 12;

// ─── Haversine distance (km) ──────────────────────────────────────────────────
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Convert Firestore doc to plain JS place object
const docToPlace = (d) => {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    location: data.location
      ? { latitude: data.location.latitude, longitude: data.location.longitude }
      : null,
  };
};

// ─── Seed 30 places (run once from Admin panel) ───────────────────────────────
export const seedPlacesToFirestore = async () => {
  const batch = writeBatch(db);
  for (const place of SEED_PLACES) {
    const ref = doc(collection(db, 'places'));
    batch.set(ref, {
      ...place,
      location: new GeoPoint(place.location.latitude, place.location.longitude),
      createdBy: 'system',
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return SEED_PLACES.length;
};

// ─── Get paginated places ─────────────────────────────────────────────────────
// NOTE: combining where + orderBy on different fields needs a composite index.
// If you see "requires index" error, click the URL in the error to create it.
export const getPlaces = async (category = null, lastDoc = null, pageSize = PAGE_SIZE) => {
  const constraints = [];

  if (category && category !== 'all') {
    // Category only – avoid composite index for now, sort client-side
    constraints.push(where('category', '==', category));
    constraints.push(limit(pageSize));
    if (lastDoc) constraints.splice(constraints.length - 1, 0, startAfter(lastDoc));
  } else {
    // All places sorted by rating
    constraints.push(orderBy('averageRating', 'desc'));
    if (lastDoc) constraints.push(startAfter(lastDoc));
    constraints.push(limit(pageSize));
  }

  const snapshot = await getDocs(query(collection(db, 'places'), ...constraints));
  const places = snapshot.docs.map(docToPlace);

  // Client-side sort for category-filtered results
  if (category && category !== 'all') {
    places.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }

  return {
    places,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

// ─── Get all places (for search + recommendations) ───────────────────────────
export const getAllPlaces = async () => {
  const snapshot = await getDocs(
    query(collection(db, 'places'), orderBy('averageRating', 'desc'), limit(100))
  );
  return snapshot.docs.map(docToPlace);
};

// ─── Get single place ─────────────────────────────────────────────────────────
export const getPlaceById = async (placeId) => {
  const snap = await getDoc(doc(db, 'places', placeId));
  if (!snap.exists()) return null;
  return docToPlace(snap);
};

// ─── Nearby places (client-side, works for small datasets) ───────────────────
export const getNearbyPlaces = async (latitude, longitude, radiusKm = 15) => {
  const all = await getAllPlaces();
  return all
    .filter((p) => {
      if (!p.location) return false;
      return calculateDistance(latitude, longitude, p.location.latitude, p.location.longitude) <= radiusKm;
    })
    .sort((a, b) => {
      const da = calculateDistance(latitude, longitude, a.location.latitude, a.location.longitude);
      const db2 = calculateDistance(latitude, longitude, b.location.latitude, b.location.longitude);
      return da - db2;
    })
    .slice(0, 20);
};

// ─── Reviews ─────────────────────────────────────────────────────────────────

// Submit review + atomically update place averageRating & reviewCount
export const submitReview = async (reviewData) => {
  const placeRef = doc(db, 'places', reviewData.placeId);
  const reviewRef = doc(collection(db, 'reviews'));

  await runTransaction(db, async (transaction) => {
    const placeSnap = await transaction.get(placeRef);
    if (!placeSnap.exists()) throw new Error('Place not found');

    const { reviewCount = 0, averageRating = 0 } = placeSnap.data();
    const newCount = reviewCount + 1;
    const newAvg = Math.round(((averageRating * reviewCount) + reviewData.rating) / newCount * 10) / 10;

    transaction.set(reviewRef, { ...reviewData, createdAt: serverTimestamp() });
    transaction.update(placeRef, { reviewCount: newCount, averageRating: newAvg });
  });

  return reviewRef.id;
};

export const createReview = async (reviewData) => {
  const ref = doc(collection(db, 'reviews'));
  await writeBatch(db).set(ref, { ...reviewData, createdAt: serverTimestamp() }).commit();
  return ref.id;
};

export const getReviewsByPlace = async (placeId, pageSize = 10, lastDoc = null) => {
  const constraints = [
    where('placeId', '==', placeId),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];
  if (lastDoc) constraints.splice(constraints.length - 1, 0, startAfter(lastDoc));

  const snapshot = await getDocs(query(collection(db, 'reviews'), ...constraints));
  return {
    reviews: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

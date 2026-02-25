import {
  collection, query, where, orderBy, limit, startAfter,
  getDocs, getDoc, doc, addDoc, updateDoc,
  serverTimestamp, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PAGE_SIZE = 10;

const docToEvent = (d) => ({ id: d.id, ...d.data() });

// ── Get paginated events ──────────────────────────────────────────────────────
export const getEvents = async (category = null, lastDoc = null, pageSize = PAGE_SIZE) => {
  const constraints = [];

  if (category && category !== 'all') {
    constraints.push(where('category', '==', category));
    constraints.push(where('status', '==', 'upcoming'));
  } else {
    constraints.push(where('status', '==', 'upcoming'));
    constraints.push(orderBy('date', 'asc'));
  }

  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));

  const snapshot = await getDocs(query(collection(db, 'events'), ...constraints));
  return {
    events: snapshot.docs.map(docToEvent),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
};

// ── Get single event ──────────────────────────────────────────────────────────
export const getEventById = async (eventId) => {
  const snap = await getDoc(doc(db, 'events', eventId));
  return snap.exists() ? docToEvent(snap) : null;
};

// ── Create event ──────────────────────────────────────────────────────────────
export const createEvent = async (eventData) => {
  const ref = await addDoc(collection(db, 'events'), {
    ...eventData,
    attendees: [],
    status: 'upcoming',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// ── Join / Leave event ────────────────────────────────────────────────────────
export const joinEvent = async (eventId, userId) => {
  await updateDoc(doc(db, 'events', eventId), {
    attendees: arrayUnion(userId),
  });
};

export const leaveEvent = async (eventId, userId) => {
  await updateDoc(doc(db, 'events', eventId), {
    attendees: arrayRemove(userId),
  });
};

// ── Seed sample events ────────────────────────────────────────────────────────
export const seedEvents = async () => {
  const SAMPLE_EVENTS = [
    {
      title: 'Saigon Street Food Festival',
      description: 'A celebration of Ho Chi Minh City\'s vibrant street food culture. Join hundreds of food vendors and thousands of food lovers for a weekend of amazing flavors, live cooking demonstrations, and cultural performances.',
      category: 'food',
      city: 'Ho Chi Minh City',
      address: 'Nguyen Hue Walking Street, District 1',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Saigon Events Co.',
      maxAttendees: 500,
      price: '$',
      status: 'upcoming',
    },
    {
      title: 'Da Nang International Fireworks Festival',
      description: 'World-class fireworks teams compete over the Han River in one of Asia\'s most spectacular fireworks competitions. Witness breathtaking displays lighting up the Da Nang night sky.',
      category: 'culture',
      city: 'Da Nang',
      address: 'Han River Bridge, Da Nang',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Da Nang Tourism',
      maxAttendees: 2000,
      price: 'free',
      status: 'upcoming',
    },
    {
      title: 'Hanoi Old Quarter Walking Tour',
      description: 'Explore the ancient streets of Hanoi\'s 36 guild streets with expert local guides. Discover hidden gems, sample local snacks, and learn about the rich history of Vietnam\'s capital.',
      category: 'outdoor',
      city: 'Ha Noi',
      address: 'Hoan Kiem Lake, Hanoi',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Hanoi Explorers',
      maxAttendees: 30,
      price: '$',
      status: 'upcoming',
    },
    {
      title: 'Vietnamese Coffee Culture Workshop',
      description: 'Dive into the art of Vietnamese coffee brewing. Learn the history of ca phe trung (egg coffee), phin drip coffee, and coconut coffee while tasting different varieties.',
      category: 'food',
      city: 'Ha Noi',
      address: 'Dinh Liet Street, Hoan Kiem District',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Hanoi Coffee Academy',
      maxAttendees: 20,
      price: '$$',
      status: 'upcoming',
    },
    {
      title: 'Marble Mountains Sunrise Trek',
      description: 'Join our guided sunrise hike up the Marble Mountains for panoramic views of Da Nang, the ocean, and surrounding landscapes. Includes temple visits and photography stops.',
      category: 'outdoor',
      city: 'Da Nang',
      address: 'Marble Mountains, Ngu Hanh Son District',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Da Nang Adventures',
      maxAttendees: 25,
      price: '$',
      status: 'upcoming',
    },
    {
      title: 'Ben Thanh Night Market Pop-Up',
      description: 'A special evening pop-up market featuring local artisans, street food vendors, and live traditional music around the iconic Ben Thanh Market area.',
      category: 'culture',
      city: 'Ho Chi Minh City',
      address: 'Ben Thanh Market area, District 1',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
      organizerId: 'system',
      organizerName: 'Saigon Night Life',
      maxAttendees: 300,
      price: 'free',
      status: 'upcoming',
    },
  ];

  let count = 0;
  for (const ev of SAMPLE_EVENTS) {
    await addDoc(collection(db, 'events'), {
      ...ev,
      attendees: [],
      createdAt: serverTimestamp(),
    });
    count++;
  }
  return count;
};

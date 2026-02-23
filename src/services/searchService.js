import Fuse from 'fuse.js';

// Fuse.js config – weighted fuzzy search across multiple fields
const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.4,          // 0 = exact, 1 = match anything
  minMatchCharLength: 2,
  keys: [
    { name: 'name',        weight: 0.5 },
    { name: 'tags',        weight: 0.25 },
    { name: 'description', weight: 0.15 },
    { name: 'city',        weight: 0.1 },
  ],
};

let fuseInstance = null;
let indexedPlaces = [];

// Call this once after loading places from Firestore
export const buildSearchIndex = (places) => {
  indexedPlaces = places;
  fuseInstance = new Fuse(places, FUSE_OPTIONS);
};

// Returns places sorted by relevance
export const searchPlaces = (query) => {
  if (!query || query.trim().length < 2) return indexedPlaces.slice(0, 20);
  if (!fuseInstance) return [];

  const results = fuseInstance.search(query.trim());
  return results.map((r) => ({
    ...r.item,
    _score: r.score, // lower = better match
  }));
};

// Quick filter by category on already-fetched places
export const filterByCategory = (places, category) => {
  if (!category || category === 'all') return places;
  return places.filter((p) => p.category === category);
};

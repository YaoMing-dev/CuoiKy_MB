// Tag-based recommendation engine
export const getRecommendedPlaces = (places = [], userInterests = [], limit = 8) => {
  if (!places.length) return [];

  if (!userInterests.length) {
    return [...places]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, limit);
  }

  const interestsLower = userInterests.map((i) => i.toLowerCase());

  const scored = places.map((place) => {
    const tags = (place.tags || []).map((t) => t.toLowerCase());
    const matches = tags.filter((tag) =>
      interestsLower.some((interest) => tag.includes(interest) || interest.includes(tag))
    ).length;
    return { ...place, _score: matches * 10 + (place.averageRating || 0) };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
};

export const getPopularPlaces = (places = [], limit = 8) => {
  if (!places.length) return [];
  return [...places]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, limit);
};

export const getNearbyFromAll = (places = [], location, radiusKm = 15, limit = 8) => {
  if (!places.length || !location) return [];

  const R = 6371;
  const scored = places
    .filter((p) => p.location)
    .map((p) => {
      const dLat = ((p.location.latitude - location.latitude) * Math.PI) / 180;
      const dLon = ((p.location.longitude - location.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((location.latitude * Math.PI) / 180) *
          Math.cos((p.location.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...p, _dist: dist };
    })
    .filter((p) => p._dist <= radiusKm)
    .sort((a, b) => a._dist - b._dist);

  return scored.slice(0, limit);
};

export function parsePhotos(rawJson, fallbackImageUrl) {
  let photos = [];
  if (rawJson && String(rawJson).trim()) {
    try {
      photos = JSON.parse(rawJson);
    } catch {
      photos = [];
    }
  }
  if (!Array.isArray(photos)) photos = [];
  photos = photos.map((x) => String(x).trim()).filter(Boolean);
  if (!photos.length && fallbackImageUrl) photos = [String(fallbackImageUrl)];
  return photos;
}

/** Linha SQLite com aliases camelCase + photos */
export function shapeProperty(r) {
  const photos = parsePhotos(r.photos, r.imageUrl);
  const cover = photos[0] || "";

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    country: r.country,
    state: r.state,
    city: r.city,
    neighborhood: r.neighborhood,
    status: r.status,
    type: r.type,
    price: r.price,
    beds: r.beds,
    baths: r.baths,
    areaSqm: r.areaSqm,
    imageUrl: cover,
    photos,
    featured: Boolean(r.featured),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

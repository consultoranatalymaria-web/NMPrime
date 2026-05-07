import Database from "better-sqlite3";

export function openDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'BR',
      state TEXT NOT NULL,
      city TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      price INTEGER NOT NULL,
      beds INTEGER NOT NULL,
      baths INTEGER NOT NULL,
      area_sqm INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(state, city);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
  `);

  migratePropertiesPhotos(db);

  return db;
}

function migratePropertiesPhotos(db) {
  const cols = db.prepare("PRAGMA table_info(properties)").all();
  const hasPhotos = cols.some((c) => c.name === "photos");
  if (!hasPhotos) db.exec("ALTER TABLE properties ADD COLUMN photos TEXT");

  const rows = db.prepare("SELECT id, image_url, photos FROM properties").all();
  const upd = db.prepare("UPDATE properties SET photos = ? WHERE id = ?");

  for (const r of rows) {
    let parsed = [];
    if (r.photos && String(r.photos).trim()) {
      try {
        parsed = JSON.parse(r.photos);
      } catch {
        parsed = [];
      }
    }
    if (Array.isArray(parsed) && parsed.length > 0) continue;
    const fallback = [];
    if (r.image_url) fallback.push(String(r.image_url));
    upd.run(JSON.stringify(fallback), r.id);
  }
}

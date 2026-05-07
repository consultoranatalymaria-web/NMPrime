import "dotenv/config";
import { openDb } from "./db.js";
import { hashPassword } from "./auth.js";

const db = openDb(process.env.DB_PATH);

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env");
  process.exit(1);
}

const hash = await hashPassword(password);

db.prepare(
  `INSERT INTO users (email, password_hash, role)
   VALUES (?, ?, 'admin')
   ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, role='admin'`
).run(email, hash);

const now = new Date().toISOString();

const existing = db.prepare("SELECT COUNT(*) as c FROM properties").get().c;
if (existing === 0) {
  const demoImage =
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80";

  const insert = db.prepare(`
    INSERT INTO properties
    (title, description, country, state, city, neighborhood, status, type, price, beds, baths, area_sqm, image_url, photos, featured, created_at, updated_at)
    VALUES
    (@title, @description, 'BR', @state, @city, @neighborhood, @status, @type, @price, @beds, @baths, @area_sqm, @image_url, @photos, @featured, @created_at, @updated_at)
  `);

  insert.run({
    title: "Apartamento moderno perto do metrô",
    description: "Apartamento bem iluminado com varanda e ótima localização.",
    state: "SP",
    city: "São Paulo",
    neighborhood: "Vila Mariana",
    status: "for-sale",
    type: "Apartamento",
    price: 780000,
    beds: 2,
    baths: 2,
    area_sqm: 74,
    image_url: demoImage,
    photos: JSON.stringify([demoImage]),
    featured: 1,
    created_at: now,
    updated_at: now,
  });
}

console.log("Seed OK. Admin:", email);

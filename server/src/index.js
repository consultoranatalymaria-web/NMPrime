  import "dotenv/config";
  import express from "express";
  import cors from "cors";
  import { z } from "zod";
  import { openDb } from "./db.js";
  import { signToken, verifyPassword, hashPassword } from "./auth.js";
  import { requireAdmin, requireAuth } from "./middleware.js";
  import { shapeProperty } from "./propertyMapper.js";
  import { ensureUploadDir, upload, uploadsStaticMiddleware } from "./uploads.js";

  ensureUploadDir();

  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", uploadsStaticMiddleware());

  const db = openDb(process.env.DB_PATH);
  // Este bloco cria o seu usuário administrador automaticamente
const criarAdminSeNaoExistir = async () => {
  try {
    const admin = db.prepare("SELECT * FROM users WHERE role='admin'").get();
    if (!admin) {
      const hash = await hashPassword("Admin12345"); // Sua senha padrão
      db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)")
        .run("admin@imobiliaria.com", hash, "admin");
      console.log("✅ Usuário admin criado no servidor!");
    }
  } catch (err) {
    console.error("Erro ao criar admin:", err);
  }
};
criarAdminSeNaoExistir();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET não definido no .env");
    process.exit(1);
  }

  app.get("/health", (req, res) => res.json({ ok: true }));

  // Login (dono/admin)
  app.post("/auth/login", async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos." });

    const user = db.prepare("SELECT * FROM users WHERE email=?").get(parsed.data.email);
    if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

    const ok = await verifyPassword(parsed.data.password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

    const token = signToken({ userId: user.id, email: user.email, role: user.role }, jwtSecret);
    res.json({ token, user: { email: user.email, role: user.role } });
  });

  app.post("/auth/change-password", requireAuth(jwtSecret), requireAdmin, async (req, res) => {
    const schema = z.object({ newPassword: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Senha inválida." });

    const hash = await hashPassword(parsed.data.newPassword);
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash, req.user.sub);
    res.json({ ok: true });
  });

  app.get("/properties", (req, res) => {
    const q = String(req.query.q || "").trim();
    const uf = String(req.query.state || "all");
    const city = String(req.query.city || "all");
    const status = String(req.query.status || "all");
    const type = String(req.query.type || "all");

    const where = [];
    const params = {};

    where.push("country='BR'");

    if (q) {
      where.push("(title LIKE @q OR neighborhood LIKE @q OR city LIKE @q OR state LIKE @q OR type LIKE @q)");
      params.q = `%${q}%`;
    }
    if (uf !== "all") {
      where.push("state=@state");
      params.state = uf;
    }
    if (city !== "all") {
      where.push("city=@city");
      params.city = city;
    }
    if (status !== "all") {
      where.push("status=@status");
      params.status = status;
    }
    if (type !== "all") {
      where.push("type=@type");
      params.type = type;
    }

    const sql = `
      SELECT
        id, title, description, country, state, city, neighborhood, status, type,
        price, beds, baths, area_sqm as areaSqm, image_url as imageUrl, photos,
        featured, created_at as createdAt, updated_at as updatedAt
      FROM properties
      WHERE ${where.join(" AND ")}
      ORDER BY featured DESC, datetime(created_at) DESC
    `;

    const rows = db.prepare(sql).all(params).map(shapeProperty);
    res.json(rows);
  });

  app.get("/admin/properties", requireAuth(jwtSecret), requireAdmin, (req, res) => {
    const rows = db
      .prepare(
        `
      SELECT
        id, title, description, country, state, city, neighborhood, status, type,
        price, beds, baths, area_sqm as areaSqm, image_url as imageUrl, photos,
        featured, created_at as createdAt, updated_at as updatedAt
      FROM properties
      WHERE country='BR'
      ORDER BY featured DESC, datetime(created_at) DESC
    `
      )
      .all()
      .map(shapeProperty);

    res.json(rows);
  });

  app.post("/admin/upload", requireAuth(jwtSecret), requireAdmin, (req, res) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "Falha no upload." });
      if (!req.file) return res.status(400).json({ error: "Envie uma imagem no campo file." });

      const port = process.env.PORT || 5174;
      const base =
        process.env.PUBLIC_ORIGIN?.replace(/\/$/, "") || `http://localhost:${port}`;
      const url = `${base}/uploads/${req.file.filename}`;
      res.json({ url });
    });
  });

  const propertySchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    state: z.string().min(2).max(2),
    city: z.string().min(2),
    neighborhood: z.string().min(2),
    status: z.enum(["for-sale", "for-rent"]),
    type: z.string().min(2),
    price: z.number().int().nonnegative(),
    beds: z.number().int().nonnegative(),
    baths: z.number().int().nonnegative(),
    areaSqm: z.number().int().nonnegative(),
    photos: z.array(z.string().url()).min(1).max(40),
    featured: z.boolean().optional().default(false),
  });

  app.post("/admin/properties", requireAuth(jwtSecret), requireAdmin, (req, res) => {
    const parsed = propertySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos." });

    const now = new Date().toISOString();
    const p = parsed.data;
    const photoJson = JSON.stringify(p.photos);
    const cover = p.photos[0];

    const info = db.prepare(`
      INSERT INTO properties
      (title, description, country, state, city, neighborhood, status, type, price, beds, baths, area_sqm, image_url, photos, featured, created_at, updated_at)
      VALUES
      (@title, @description, 'BR', @state, @city, @neighborhood, @status, @type, @price, @beds, @baths, @area_sqm, @image_url, @photos, @featured, @created_at, @updated_at)
    `).run({
      title: p.title,
      description: p.description,
      state: p.state.toUpperCase(),
      city: p.city,
      neighborhood: p.neighborhood,
      status: p.status,
      type: p.type,
      price: p.price,
      beds: p.beds,
      baths: p.baths,
      area_sqm: p.areaSqm,
      image_url: cover,
      photos: photoJson,
      featured: p.featured ? 1 : 0,
      created_at: now,
      updated_at: now,
    });

    res.json({ id: info.lastInsertRowid });
  });

  app.put("/admin/properties/:id", requireAuth(jwtSecret), requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido." });

    const parsed = propertySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos." });

    const now = new Date().toISOString();
    const p = parsed.data;
    const photoJson = JSON.stringify(p.photos);
    const cover = p.photos[0];

    const info = db.prepare(`
      UPDATE properties SET
        title=@title,
        description=@description,
        state=@state,
        city=@city,
        neighborhood=@neighborhood,
        status=@status,
        type=@type,
        price=@price,
        beds=@beds,
        baths=@baths,
        area_sqm=@area_sqm,
        image_url=@image_url,
        photos=@photos,
        featured=@featured,
        updated_at=@updated_at
      WHERE id=@id
    `).run({
      id,
      title: p.title,
      description: p.description,
      state: p.state.toUpperCase(),
      city: p.city,
      neighborhood: p.neighborhood,
      status: p.status,
      type: p.type,
      price: p.price,
      beds: p.beds,
      baths: p.baths,
      area_sqm: p.areaSqm,
      image_url: cover,
      photos: photoJson,
      featured: p.featured ? 1 : 0,
      updated_at: now,
    });

    if (info.changes === 0) return res.status(404).json({ error: "Imóvel não encontrado." });
    res.json({ ok: true });
  });

  app.delete("/admin/properties/:id", requireAuth(jwtSecret), requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido." });

    const info = db.prepare("DELETE FROM properties WHERE id=?").run(id);
    if (info.changes === 0) return res.status(404).json({ error: "Imóvel não encontrado." });
    res.json({ ok: true });
  });
// Remove as linhas repetidas e deixe apenas este bloco:
const PORT = process.env.PORT || 5174; 

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

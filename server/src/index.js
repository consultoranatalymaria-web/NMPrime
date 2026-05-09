 import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { db } from "./db.js"; // Importando a conexão nova que fizemos
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

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("JWT_SECRET não definido no .env");
  process.exit(1);
}

// Cria o admin no Supabase se não existir
const criarAdminSeNaoExistir = async () => {
  try {
    const res = await db.query("SELECT * FROM users WHERE role='admin' LIMIT 1");
    if (res.rowCount === 0) {
      const hash = await hashPassword("Admin12345");
      await db.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
        ["admin@imobiliaria.com", hash, "admin"]
      );
      console.log("✅ Usuário admin criado no Supabase!");
    }
  } catch (err) {
    console.error("Erro ao verificar/criar admin:", err);
  }
};
criarAdminSeNaoExistir();

app.get("/health", (req, res) => res.json({ ok: true }));

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

    const token = signToken({ userId: user.id, email: user.email, role: user.role }, jwtSecret);
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// Listagem de Imóveis (Público)
app.get("/properties", async (req, res) => {
  try {
    const { q, state, city, status, type } = req.query;
    let sql = "SELECT * FROM properties WHERE country='BR'";
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (title ILIKE $${params.length} OR neighborhood ILIKE $${params.length})`;
    }
    // Adicione outros filtros aqui se desejar seguir o padrão acima ($1, $2...)

    sql += " ORDER BY featured DESC, created_at DESC";
    const result = await db.query(sql, params);
    res.json(result.rows.map(shapeProperty));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro de Imóvel
app.post("/properties", requireAuth(jwtSecret), requireAdmin, async (req, res) => {
  const p = req.body;
  const photoJson = JSON.stringify(p.photos);
  const sql = `
    INSERT INTO properties 
    (title, description, country, state, city, neighborhood, status, type, price, beds, baths, area_sqm, image_url, photos, featured)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`;
  
  const values = [
    p.title, p.description, 'BR', p.state.toUpperCase(), p.city, p.neighborhood,
    p.status, p.type, p.price, p.beds, p.baths, p.areaSqm, p.photos[0], photoJson, p.featured
  ];

  try {
    const result = await db.query(sql, values);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota de Upload de Imagem
app.post("/admin/upload", requireAuth(jwtSecret), requireAdmin, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "Falha no upload." });
    const base = process.env.PUBLIC_ORIGIN || "https://nmprime-api.onrender.com";
    const url = `${base}/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
app.put("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;

    const sql = `
      UPDATE properties SET
        title = $1,
        description = $2,
        country = 'BR',
        state = $3,
        city = $4,
        neighborhood = $5,
        status = $6,
        type = $7,
        price = $8,
        beds = $9,
        baths = $10,
        area_sqm = $11,
        image_url = $12,
        photos = $13,
        featured = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
    `;

    const values = [
      p.title,
      p.description,
      p.state,
      p.city,
      p.neighborhood,
      p.status,
      p.type,
      p.price,
      p.beds,
      p.baths,
      p.areaSqm,
      p.photos?.[0],
      JSON.stringify(p.photos),
      p.featured,
      Number(id)
    ];

    await db.query(sql, values);

    res.json({ message: "Atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});app.delete("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM properties WHERE id = $1",
      [Number(id)]
    );

    res.json({ message: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
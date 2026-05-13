import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabase.js";
import { db } from "./db.js";
import { signToken, verifyPassword, hashPassword } from "./auth.js";
import { requireAdmin, requireAuth } from "./middleware.js";
import { shapeProperty } from "./propertyMapper.js";
import cors from "cors";
import multer from "multer"; // <-- ADICIONE ESTA LINHA
import { supabase } from "./supabase.js";

const app = express();
const app = express();

// Configuração do Multer para ler as imagens na memória antes de mandar ao Supabase
const upload = multer({ storage: multer.memoryStorage() }); // <-- ADICIONE ESTA LINHA

/* =========================
   MIDDLEWARES
========================= */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

/* =========================
   ENV CHECK
========================= */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("JWT_SECRET não definido no .env");
  process.exit(1);
}

/* =========================
   CREATE ADMIN
========================= */
const criarAdminSeNaoExistir = async () => {
  try {
    const res = await db.query(
      "SELECT * FROM users WHERE role='admin' LIMIT 1"
    );

    if (res.rowCount === 0) {
      const hash = await hashPassword("Admin12345");

      await db.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
        ["admin@imobiliaria.com", hash, "admin"]
      );

      console.log("✅ Usuário admin criado!");
    }
  } catch (err) {
    console.error("Erro ao criar admin:", err);
  }
};

criarAdminSeNaoExistir();

/* =========================
   HEALTH
========================= */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* =========================
   LOGIN
========================= */
/* =========================
   UPLOAD (SUPABASE STORAGE)
========================= */
app.post(
  "/admin/upload",
  requireAuth(jwtSecret),
  requireAdmin,
  upload.single("file"), // <-- Mudamos a sintaxe aqui para ficar mais limpa e segura
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      const filePath = `${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from("properties")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const { data } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      return res.json({ url: data.publicUrl });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

app.get("/properties", async (req, res) => {
  try {
    const { q } = req.query;

    let sql = "SELECT * FROM properties WHERE country='BR'";
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (title ILIKE $1 OR neighborhood ILIKE $1)`;
    }

    sql += " ORDER BY featured DESC, created_at DESC";

    const result = await db.query(sql, params);

    res.json(result.rows.map(shapeProperty));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   CREATE PROPERTY
========================= */
app.post(
  "/properties",
  requireAuth(jwtSecret),
  requireAdmin,
  async (req, res) => {
    const p = req.body;

    const sql = `
      INSERT INTO properties (
        title, description, country, state, city,
        neighborhood, status, type, price,
        beds, baths, area_sqm, image_url, photos, featured
      )
      VALUES ($1,$2,'BR',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id
    `;

    const values = [
      p.title,
      p.description,
      p.state?.toUpperCase(),
      p.city,
      p.neighborhood,
      p.status,
      p.type,
      p.price,
      p.beds,
      p.baths,
      p.areaSqm,
      p.photos?.[0] || null,
      JSON.stringify(p.photos || []),
      p.featured || false,
    ];

    try {
      const result = await db.query(sql, values);
      res.json({ id: result.rows[0].id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   UPDATE PROPERTY
========================= */
app.put("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;

    const sql = `
      UPDATE properties SET
        title=$1,
        description=$2,
        state=$3,
        city=$4,
        neighborhood=$5,
        status=$6,
        type=$7,
        price=$8,
        beds=$9,
        baths=$10,
        area_sqm=$11,
        image_url=$12,
        photos=$13,
        featured=$14,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=$15
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
      p.photos?.[0] || null,
      JSON.stringify(p.photos || []),
      p.featured,
      Number(id),
    ];

    await db.query(sql, values);

    res.json({ message: "Atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE PROPERTY
========================= */
app.delete("/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM properties WHERE id=$1", [
      Number(id),
    ]);

    res.json({ message: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPLOAD (SUPABASE STORAGE)
========================= */
app.post(
  "/admin/upload",
  requireAuth(jwtSecret),
  requireAdmin,
  (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "Falha no upload." });
      }

      const file = req.file;
      const filePath = `${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from("properties")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const { data } = supabase.storage
        .from("properties")
        .getPublicUrl(filePath);

      res.json({ url: data.publicUrl });
    });
  }
);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5174;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
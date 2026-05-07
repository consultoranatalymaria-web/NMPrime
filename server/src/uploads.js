import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import express from "express";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

/** Pasta onde ficam os arquivos enviados: server/uploads */
export const uploadDir = path.join(projectRoot, "uploads");

export function ensureUploadDir() {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

/** Multer configurado para 1 arquivo por vez (campo multipart "file") */
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const mt = String(file.mimetype || "").toLowerCase();
    const ext = path.extname(file.originalname || "").toLowerCase();
    const okMime = /^image\/(jpeg|pjpeg|png|webp|gif)$/i.test(mt);
    const okExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
    if (okMime || okExt) return cb(null, true);
    return cb(new Error("Apenas imagens JPG, PNG, WEBP ou GIF."));
  },
});

/** Servir fotos públicas em GET /uploads/<arquivo> */
export function uploadsStaticMiddleware() {
  return express.static(uploadDir, { fallthrough: false });
}


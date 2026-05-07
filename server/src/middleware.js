import { verifyToken } from "./auth.js";

export function requireAuth(jwtSecret) {
  return (req, res, next) => {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ error: "Não autenticado." });

    try {
      const payload = verifyToken(token, jwtSecret);
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Token inválido/expirado." });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Sem permissão." });
  next();
}


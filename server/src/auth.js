import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function signToken({ userId, email, role }, jwtSecret) {
  return jwt.sign({ sub: userId, email, role }, jwtSecret, { expiresIn: "12h" });
}

export function verifyToken(token, jwtSecret) {
  return jwt.verify(token, jwtSecret);
}

import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

import { getUserFromToken } from "../services/repository.service.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Sessao invalida" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: "Sessao expirada ou invalida" });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

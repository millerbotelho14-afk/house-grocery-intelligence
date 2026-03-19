import { comparePassword, generateSessionToken, hashPassword } from "../utils/auth.js";
import {
  createGuestSession,
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  getGuestCodeFromUser,
  getUserFromToken
} from "../services/repository.service.js";

export async function guest(req, res) {
  const session = await createGuestSession(req.body?.guestCode || "");
  return res.status(201).json({
    token: session.token,
    guestCode: session.guestCode,
    user: sanitizeUser(session.user)
  });
}

export async function register(req, res) {
  const { fullName, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios" });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: "Ja existe uma conta com esse email" });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    fullName: fullName || email.split("@")[0]
  });

  const token = generateSessionToken();
  await createSession(user.id, token);

  return res.status(201).json({
    token,
    user
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios" });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Credenciais invalidas" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Credenciais invalidas" });
  }

  const token = generateSessionToken();
  await createSession(user.id, token);

  return res.json({
    token,
    user: sanitizeUser(user)
  });
}

export async function me(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Sessao invalida" });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ message: "Sessao expirada ou invalida" });
  }

  return res.json({ user: sanitizeUser(user) });
}

export async function logout(req, res) {
  await deleteSession(req.sessionToken);
  return res.json({ message: "Logout realizado" });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || user.full_name || "",
    guestCode: getGuestCodeFromUser(user)
  };
}

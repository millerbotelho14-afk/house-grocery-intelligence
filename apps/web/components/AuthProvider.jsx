"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "house-grocery-session";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [guestCode, setGuestCode] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void bootstrapGuestSession();
  }, []);

  async function login(credentials) {
    const response = await api.login(credentials);
    persist(response);
    return response;
  }

  async function register(credentials) {
    const response = await api.register(credentials);
    persist(response);
    return response;
  }

  async function logout() {
    if (token) {
      try {
        await api.logout(token);
      } catch (_error) {
        // Nao bloqueia logout local
      }
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setGuestCode("");
    setReady(false);
    await bootstrapGuestSession();
  }

  function persist(response) {
    const nextSession = {
      token: response.token,
      user: response.user,
      guestCode: response.guestCode || response.user?.guestCode || ""
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setToken(response.token);
    setUser(response.user);
    setGuestCode(nextSession.guestCode);
  }

  async function bootstrapGuestSession() {
    setLoading(true);
    setError("");
    const saved = getSavedSession();

    try {
      if (saved?.token) {
        const response = await api.me(saved.token);
        persist({
          token: saved.token,
          user: response.user,
          guestCode: response.user?.guestCode || saved.guestCode || ""
        });
        setReady(true);
        setLoading(false);
        return;
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      setGuestCode("");
      setError(error.message || "Nao consegui restaurar sua sessao.");
    }

    try {
      const guestSession = await api.guest(saved?.guestCode || "");
      persist(guestSession);
      setError("");
    } catch (error) {
      setError(error.message || "Nao consegui iniciar seu modo convidado.");
    } finally {
      setReady(true);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        guestCode,
        ready,
        loading,
        error,
        retrySession: bootstrapGuestSession,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function getSavedSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }
  return context;
}

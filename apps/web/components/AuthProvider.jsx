"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "house-grocery-session";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setReady(true);
      return;
    }

    const session = JSON.parse(saved);
    setToken(session.token);
    api
      .me(session.token)
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setReady(true);
      });
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
  }

  function persist(response) {
    const nextSession = {
      token: response.token,
      user: response.user
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setToken(response.token);
    setUser(response.user);
  }

  return (
    <AuthContext.Provider value={{ token, user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }
  return context;
}

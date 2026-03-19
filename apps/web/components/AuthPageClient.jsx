"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthPageClient() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ fullName, email, password });
      }
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="glass rounded-[28px] p-6 md:p-8">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 text-sm ${mode === "login" ? "bg-[var(--ink)] text-white" : "stat-pill"}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 text-sm ${mode === "register" ? "bg-[var(--ink)] text-white" : "stat-pill"}`}
          >
            Criar conta
          </button>
        </div>

        <h1 className="mt-6 text-4xl font-semibold">
          {mode === "login" ? "Acesse seu painel de compras" : "Crie sua conta pessoal"}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Login simples para voce usar no celular e em outros computadores.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {mode === "register" && (
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              placeholder="Seu nome"
            />
          )}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            placeholder="Seu email"
            type="email"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
            placeholder="Sua senha"
            type="password"
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">
            {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}

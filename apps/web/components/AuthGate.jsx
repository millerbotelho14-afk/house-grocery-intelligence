"use client";

import { useAuth } from "./AuthProvider";

export function AuthGate({ children, title = "Abrindo seu historico" }) {
  const { error, loading, ready, retrySession, user } = useAuth();

  if (!ready || loading) {
    return <div className="glass rounded-[24px] p-6">Carregando sua sessao...</div>;
  }

  if (!user) {
    return (
      <div className="glass rounded-[28px] p-6 text-center">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="mt-3 text-[var(--muted)]">
          {error || "Nao consegui abrir seu modo convidado agora."}
        </p>
        <button onClick={() => void retrySession()} className="mt-6 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">
          Tentar novamente
        </button>
      </div>
    );
  }

  return children;
}

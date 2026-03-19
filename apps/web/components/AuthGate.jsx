"use client";

import { useAuth } from "./AuthProvider";

export function AuthGate({ children, title = "Entre para usar seu historico" }) {
  const { ready, user } = useAuth();

  if (!ready) {
    return <div className="glass rounded-[24px] p-6">Carregando sua sessao...</div>;
  }

  if (!user) {
    return (
      <div className="glass rounded-[28px] p-6 text-center">
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="mt-3 text-[var(--muted)]">
          Estamos preparando seu espaco de convidado e tentando restaurar sua sessao local.
        </p>
      </div>
    );
  }

  return children;
}

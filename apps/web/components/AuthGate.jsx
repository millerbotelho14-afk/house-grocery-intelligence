"use client";

import Link from "next/link";
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
          Crie sua conta simples para salvar suas compras e acessar pelo celular ou computador.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

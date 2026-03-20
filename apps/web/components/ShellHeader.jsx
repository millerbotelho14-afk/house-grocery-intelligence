"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  AssistantIcon,
  DashboardIcon,
  DataIcon,
  LookupIcon,
  PurchasesIcon,
  UploadIcon
} from "./AppIcons";

const links = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/upload", label: "Registrar", icon: UploadIcon },
  { href: "/price-lookup", label: "Lookup", icon: LookupIcon },
  { href: "/purchases", label: "Compras", icon: PurchasesIcon },
  { href: "/data", label: "Banco", icon: DataIcon },
  { href: "/assistant", label: "Assistente", icon: AssistantIcon }
];

export function ShellHeader() {
  const pathname = usePathname();
  const { guestCode, user } = useAuth();

  return (
    <header className="glass rounded-[32px] p-5 md:p-6">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">House Grocery Intelligence</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight">Compras da casa sem planilha.</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Leia cupons com IA, ajuste os dados em tabela e acompanhe seus precos no dia a dia.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {user ? (
            <span className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3 text-[var(--muted)]">
              Espaco ativo
              <span className="mt-1 block font-semibold text-[var(--ink)]">{user.fullName || user.email}</span>
            </span>
          ) : null}
          {guestCode ? (
            <span className="rounded-[20px] border border-[var(--line)] px-4 py-3 text-[var(--ink)]">
              Codigo convidado
              <span className="mt-1 block font-semibold">{guestCode}</span>
            </span>
          ) : null}
        </div>

        <nav className="nav-dock">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href} className={`nav-pill ${active ? "nav-pill-active" : ""}`}>
                <span className="nav-icon">
                  <Icon />
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-[24px] bg-[var(--panel-strong)] px-4 py-4 text-sm text-[var(--muted)]">
          Tudo o que voce confirmar fica salvo no seu banco e reaparece no dashboard, lookup e historico.
        </div>
      </div>
    </header>
  );
}

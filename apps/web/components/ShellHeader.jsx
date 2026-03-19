"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/price-lookup", label: "Price Lookup" },
  { href: "/purchases", label: "Compras" },
  { href: "/data", label: "Dados" },
  { href: "/assistant", label: "Assistente" }
];

export function ShellHeader() {
  const pathname = usePathname();
  const { guestCode, user } = useAuth();

  return (
    <header className="glass mb-8 rounded-[28px] p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">House Grocery Intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-5xl">
            Seu supermercado, organizado como um produto.
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active ? "bg-[var(--ink)] text-white" : "stat-pill text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {user ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <span>
            Modo convidado ativo em{" "}
            <span className="font-semibold text-[var(--ink)]">{user.fullName || user.email}</span>
          </span>
          {guestCode ? <span className="stat-pill rounded-full px-3 py-1 text-[var(--ink)]">Codigo {guestCode}</span> : null}
        </div>
      ) : null}
    </header>
  );
}

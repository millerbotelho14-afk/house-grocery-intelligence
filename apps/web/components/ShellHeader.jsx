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
    <header className="glass mb-8 rounded-[32px] p-5 md:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--muted)]">House Grocery Intelligence</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              Sua rotina de supermercado, com memoria de produto e clareza de decisao.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            {user ? (
              <span className="rounded-full bg-[var(--panel-strong)] px-4 py-2">
                Espaco ativo: <span className="font-semibold text-[var(--ink)]">{user.fullName || user.email}</span>
              </span>
            ) : null}
            {guestCode ? (
              <span className="rounded-full border border-[var(--line)] px-4 py-2 text-[var(--ink)]">
                Codigo {guestCode}
              </span>
            ) : null}
          </div>
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
      </div>
    </header>
  );
}

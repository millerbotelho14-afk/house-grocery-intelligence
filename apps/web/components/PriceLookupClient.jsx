"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthGate } from "./AuthGate";
import { useAuth } from "./AuthProvider";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function PriceLookupClient() {
  const { token } = useAuth();
  const [query, setQuery] = useState("azeite");
  const [lookup, setLookup] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!token) return;
    const timeout = setTimeout(async () => {
      try {
        const [nextLookup, nextProducts] = await Promise.all([
          api.priceLookup(token, query),
          api.products(token, query)
        ]);
        setLookup(nextLookup);
        setSuggestions(nextProducts);
      } catch (_error) {
        setLookup(null);
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, token]);

  return (
    <AuthGate title="Entre para consultar seus precos no mercado">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="glass rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Price Lookup</p>
          <h2 className="mt-3 text-3xl font-semibold">Consulta rapida no corredor do mercado</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-6 w-full rounded-[22px] border border-[var(--line)] bg-white px-5 py-4 text-lg"
            placeholder="Digite leite, italac, azeite..."
          />
          {lookup ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Metric label="Ultimo preco" value={money(lookup.lastPrice)} />
              <Metric label="Menor preco" value={money(lookup.lowestPrice)} />
              <Metric label="Maior preco" value={money(lookup.highestPrice)} />
              <Metric label="Media" value={money(lookup.averagePrice)} />
              <Metric label="Ultima loja" value={lookup.lastStore} />
              <Metric label="Data" value={lookup.lastPurchaseDate} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">Busque um produto para ver seus historicos.</p>
          )}
        </section>

        <aside className="glass rounded-[28px] p-5">
          <h3 className="text-xl font-semibold">Busca inteligente</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Fuzzy search agrupando variacoes como "leite", "italac" e "leite italac".
          </p>
          <div className="mt-5 space-y-3">
            {suggestions.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="block rounded-2xl bg-[var(--panel-strong)] p-4 transition hover:translate-y-[-1px]"
              >
                <p className="font-semibold">{product.normalizedName}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {product.category} • {product.matches} registros
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </AuthGate>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[22px] bg-[var(--panel-strong)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function ProductPageClient({ id }) {
  const { token } = useAuth();
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    if (!token) return;
    api.product(token, id).then(setProductData).catch(() => setProductData(null));
  }, [token, id]);

  return (
    <AuthGate title="Entre para consultar o historico do produto">
      {!productData ? (
        <div className="glass rounded-[24px] p-6">Carregando produto...</div>
      ) : (
        <ProductContent productData={productData} />
      )}
    </AuthGate>
  );
}

function ProductContent({ productData }) {
  const max = Math.max(...productData.history.map((point) => point.price), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="glass rounded-[28px] p-5">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Produto</p>
        <h1 className="mt-3 text-4xl font-semibold">{productData.product.normalizedName}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{productData.product.category}</p>
        <div className="mt-6 rounded-[24px] bg-[var(--panel-strong)] p-5">
          <div className="flex items-end gap-4">
            {productData.history.map((point) => (
              <div key={point.id} className="flex flex-1 flex-col items-center gap-3">
                <div className="chart-bar w-full" style={{ height: `${Math.max((point.price / max) * 180, 20)}px` }} />
                <div className="text-center text-xs">
                  <p>{point.date}</p>
                  <p className="text-[var(--muted)]">{money(point.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm">
            Variacao: {productData.priceVariationPercent}%
          </div>
          <Link href="/price-lookup" className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white">
            Voltar ao lookup
          </Link>
        </div>
      </section>

      <aside className="glass rounded-[28px] p-5">
        <h2 className="text-2xl font-semibold">Compras registradas</h2>
        <div className="mt-5 space-y-3">
          {productData.purchases.map((purchase) => (
            <article key={purchase.id} className="rounded-[20px] bg-[var(--panel-strong)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{purchase.store.name}</p>
                <p className="text-sm text-[var(--muted)]">{purchase.purchase.purchaseDate}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{purchase.originalName}</p>
              <p className="mt-3 text-sm">
                {purchase.quantity} un. • {money(purchase.unitPrice)} • total {money(purchase.totalPrice)}
              </p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

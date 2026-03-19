"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function PurchasesClient() {
  const { token } = useAuth();
  const [purchases, setPurchases] = useState(null);

  useEffect(() => {
    if (!token) return;
    api.purchases(token).then(setPurchases).catch(() => setPurchases([]));
  }, [token]);

  return (
    <AuthGate title="Entre para ver seu historico de compras">
      {!purchases ? (
        <div className="glass rounded-[24px] p-6">Carregando compras...</div>
      ) : purchases.length === 0 ? (
        <div className="glass rounded-[24px] p-6">Voce ainda nao importou nenhuma compra.</div>
      ) : (
        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <article key={purchase.id} className="glass rounded-[24px] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">{purchase.purchaseDate}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{purchase.store.name}</h2>
                  <p className="text-sm text-[var(--muted)]">{purchase.store.location}</p>
                </div>
                <div className="rounded-full bg-[var(--panel-strong)] px-4 py-2 text-sm">
                  {money(purchase.totalValue)} • {purchase.itemsCount} itens
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {purchase.items.map((item) => (
                  <div key={item.id} className="rounded-[20px] bg-[var(--panel-strong)] p-4">
                    <p className="font-semibold">{item.normalizedProductName}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.quantity} un. • {money(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AuthGate>
  );
}

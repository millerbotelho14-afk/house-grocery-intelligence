"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { api } from "@/lib/api";
import { LineBars, PieLegend, RankedBars } from "@/components/SimpleCharts";
import { StatCard } from "@/components/StatCard";
import { AuthGate } from "./AuthGate";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function DashboardClient() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.dashboard(token).then(setDashboard).catch((err) => setError(err.message));
  }, [token]);

  return (
    <AuthGate>
      {!dashboard ? (
        <div className="glass rounded-[24px] p-6">{error || "Carregando dashboard..."}</div>
      ) : (
        <DashboardContent dashboard={dashboard} />
      )}
    </AuthGate>
  );
}

function DashboardContent({ dashboard }) {
  const latestMonth = dashboard.monthlySpending.at(-1) || { month: "-", total: 0 };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard eyebrow="Gasto mensal" title="Mes mais recente" value={money(latestMonth.total)} detail={`Referencia ${latestMonth.month}`} />
        <StatCard eyebrow="Produto quente" title="Maior alta" value={`${dashboard.insights.biggestPriceIncrease[0]?.variationPercent || 0}%`} detail={dashboard.insights.biggestPriceIncrease[0]?.product || "Sem dados"} />
        <StatCard eyebrow="Loja lider" title="Melhor media" value={dashboard.insights.cheapestStores[0]?.store || "N/A"} detail={`Ticket medio ${money(dashboard.insights.cheapestStores[0]?.averagePrice || 0)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <LineBars data={dashboard.monthlySpending.length ? dashboard.monthlySpending : [{ month: "Sem dados", total: 0 }]} />
        <PieLegend data={dashboard.spendingByCategory.length ? dashboard.spendingByCategory : [{ category: "Sem dados", total: 0 }]} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankedBars
          title="Top Purchased Products"
          rows={(dashboard.topPurchasedProducts.length ? dashboard.topPurchasedProducts : [{ product: "Sem dados", quantity: 0 }]).map((item) => ({
            label: item.product,
            value: item.quantity
          }))}
          formatter={(value) => `${value} un.`}
        />
        <RankedBars
          title="Most Expensive Products"
          rows={(dashboard.mostExpensiveProducts.length ? dashboard.mostExpensiveProducts : [{ product: "Sem dados", averagePrice: 0 }]).map((item) => ({
            label: item.product,
            value: item.averagePrice
          }))}
          formatter={(value) => money(value)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="glass rounded-[24px] p-5">
          <h2 className="text-2xl font-semibold">Insights automaticos</h2>
          <div className="mt-5 grid gap-3">
            {[...dashboard.insights.biggestPriceIncrease, ...dashboard.insights.mostFrequentProducts, ...dashboard.insights.cheapestStores].length ? (
              <>
                {dashboard.insights.biggestPriceIncrease.map((item) => (
                  <InsightRow key={`increase-${item.product}`} label="Maior aumento" title={item.product} meta={`${item.variationPercent}%`} />
                ))}
                {dashboard.insights.mostFrequentProducts.map((item) => (
                  <InsightRow key={`freq-${item.product}`} label="Mais frequente" title={item.product} meta={`${item.purchases} compras`} />
                ))}
                {dashboard.insights.cheapestStores.map((item) => (
                  <InsightRow key={`store-${item.store}`} label="Loja economica" title={item.store} meta={money(item.averagePrice)} />
                ))}
              </>
            ) : (
              <InsightRow label="Comece agora" title="Ainda nao ha historico suficiente" meta="Importe seu primeiro cupom" />
            )}
          </div>
        </div>

        <div className="glass rounded-[24px] p-5">
          <h2 className="text-2xl font-semibold">Fluxo do app</h2>
          <ol className="mt-5 space-y-3 text-sm text-[var(--muted)]">
            <li>1. Crie sua conta e faca login</li>
            <li>2. Envie cupom por link NFC-e, XML, PDF ou imagem</li>
            <li>3. O sistema extrai itens e normaliza produtos</li>
            <li>4. O historico fica salvo no seu banco PostgreSQL</li>
            <li>5. Use no mercado pelo celular com Price Lookup</li>
          </ol>
          <Link href="/upload" className="mt-6 inline-flex rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">
            Importar novo cupom
          </Link>
        </div>
      </section>
    </div>
  );
}

function InsightRow({ label, title, meta }) {
  return (
    <div className="rounded-[20px] bg-[var(--panel-strong)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-[var(--muted)]">{meta}</p>
      </div>
    </div>
  );
}

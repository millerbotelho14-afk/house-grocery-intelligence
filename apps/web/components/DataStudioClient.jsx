"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

export function DataStudioClient() {
  const { token } = useAuth();
  const [items, setItems] = useState(null);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    if (!token) return;
    api.dataItems(token).then(setItems).catch(() => setItems([]));
  }, [token]);

  async function saveItem(item) {
    setSavingId(item.id);
    const updated = await api.updatePurchaseItem(token, item.id, item);
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...updated } : entry)));
    setSavingId("");
  }

  return (
    <AuthGate title="Entre para revisar e corrigir seus dados">
      {!items ? (
        <div className="glass rounded-[24px] p-6">Carregando itens do banco...</div>
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-[24px] p-6">
            <h2 className="text-3xl font-semibold">Banco de dados editavel</h2>
            <p className="mt-2 text-[var(--muted)]">
              Aqui voce revisa os itens lidos do cupom, corrige divergencias e adiciona comentarios. O app reflete essas alteracoes.
            </p>
          </div>
          {items.map((item, index) => (
            <EditableItemCard
              key={item.id}
              item={item}
              onSave={saveItem}
              saving={savingId === item.id}
              number={index + 1}
            />
          ))}
        </div>
      )}
    </AuthGate>
  );
}

function EditableItemCard({ item, onSave, saving, number }) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <article className="glass rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Item {number}</p>
          <h3 className="text-xl font-semibold">{draft.storeName}</h3>
          <p className="text-sm text-[var(--muted)]">{draft.purchaseDate}</p>
        </div>
        <button onClick={() => onSave(draft)} className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white">
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Nome original" value={draft.originalName} onChange={(value) => setDraft({ ...draft, originalName: value })} />
        <Input label="Nome normalizado" value={draft.normalizedProductName} onChange={(value) => setDraft({ ...draft, normalizedProductName: value })} />
        <Input label="Quantidade" type="number" value={draft.quantity} onChange={(value) => setDraft({ ...draft, quantity: Number(value) })} />
        <Input label="Preco unitario" type="number" value={draft.unitPrice} onChange={(value) => setDraft({ ...draft, unitPrice: Number(value) })} />
        <Input label="Preco total" type="number" value={draft.totalPrice} onChange={(value) => setDraft({ ...draft, totalPrice: Number(value) })} />
        <label className="grid gap-2 text-sm md:col-span-2">
          Comentario
          <textarea
            value={draft.userComment || ""}
            onChange={(event) => setDraft({ ...draft, userComment: event.target.value })}
            className="min-h-24 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
          />
        </label>
      </div>
    </article>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
      />
    </label>
  );
}

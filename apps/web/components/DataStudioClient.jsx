"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function DataStudioClient() {
  const { token } = useAuth();
  const [items, setItems] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState(null);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .dataItems(token)
      .then(setItems)
      .catch((nextError) => {
        setError(nextError.message);
        setItems([]);
      });
  }, [token]);

  function startEditing(item) {
    setEditingId(item.id);
    setDraft({ ...item });
    setError("");
  }

  function cancelEditing() {
    setEditingId("");
    setDraft(null);
  }

  async function saveCurrentRow() {
    if (!draft) return;
    setSavingId(draft.id);
    setError("");

    try {
      await api.updatePurchaseItem(token, draft.id, draft);
      const refreshed = await api.dataItems(token);
      setItems(refreshed);
      setEditingId("");
      setDraft(null);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSavingId("");
    }
  }

  return (
    <AuthGate title="Revise e corrija seus dados">
      {!items ? (
        <div className="glass rounded-[24px] p-6">Carregando itens do banco...</div>
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-[28px] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Banco</p>
                <h2 className="mt-2 text-3xl font-semibold">Tabela editavel de compras</h2>
                <p className="mt-2 text-[var(--muted)]">
                  Edite linha por linha, ajuste nomes, valores e comentarios. As mudancas refletem no banco e nos analytics.
                </p>
              </div>
              <Link href="/upload" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
                Adicionar compra manual ou por cupom
              </Link>
            </div>
            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          </div>

          <div className="glass overflow-hidden rounded-[28px]">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full border-collapse text-sm">
                <thead className="bg-[var(--accent-soft)] text-left">
                  <tr className="border-b border-[var(--line)]">
                    {["Data", "Loja", "Nome original", "Nome padrao", "Qtd.", "Unitario", "Total", "Comentario", "Acoes"].map((label) => (
                      <th key={label} className="px-4 py-4 font-medium text-[var(--muted)]">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const editing = editingId === item.id;
                    const row = editing ? draft : item;

                    return (
                      <tr key={item.id} className="border-b border-[var(--line)] align-top last:border-b-0">
                        <td className="px-4 py-4">{row.purchaseDate}</td>
                        <td className="px-4 py-4">
                          <div className="max-w-[170px]">{row.storeName}</div>
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <CellInput value={row.originalName} onChange={(value) => setDraft({ ...row, originalName: value })} />
                          ) : (
                            row.originalName
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <CellInput
                              value={row.normalizedProductName}
                              onChange={(value) => setDraft({ ...row, normalizedProductName: value })}
                            />
                          ) : (
                            row.normalizedProductName
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <CellInput
                              type="number"
                              value={row.quantity}
                              onChange={(value) => setDraft(recalculateRowDraft(row, { quantity: Number(value) }))}
                            />
                          ) : (
                            row.quantity
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <CellInput
                              type="number"
                              value={row.unitPrice}
                              onChange={(value) => setDraft(recalculateRowDraft(row, { unitPrice: Number(value) }))}
                            />
                          ) : (
                            money(row.unitPrice)
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <CellInput
                              type="number"
                              value={row.totalPrice}
                              onChange={(value) => setDraft(recalculateRowDraft(row, { totalPrice: Number(value) }, "total"))}
                            />
                          ) : (
                            money(row.totalPrice)
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <textarea
                              value={row.userComment || ""}
                              onChange={(event) => setDraft({ ...row, userComment: event.target.value })}
                              className="min-h-20 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                            />
                          ) : (
                            <div className="max-w-[220px] text-[var(--muted)]">{row.userComment || "-"}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {editing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={saveCurrentRow}
                                className="rounded-full bg-[var(--ink)] px-3 py-2 text-xs text-white"
                              >
                                {savingId === row.id ? "Salvando..." : "Salvar"}
                              </button>
                              <button onClick={cancelEditing} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEditing(item)} className="rounded-full border border-[var(--line)] px-3 py-2 text-xs">
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AuthGate>
  );
}

function CellInput({ value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-[140px] rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
    />
  );
}

function recalculateRowDraft(row, patch, priority = "unit") {
  const next = { ...row, ...patch };
  const quantity = Number(next.quantity || 0);
  const unitPrice = Number(next.unitPrice || 0);
  const totalPrice = Number(next.totalPrice || 0);

  if (priority === "total" && quantity > 0) {
    next.unitPrice = roundMoney(totalPrice / quantity);
    return next;
  }

  next.totalPrice = roundMoney(quantity * unitPrice);
  return next;
}

function roundMoney(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

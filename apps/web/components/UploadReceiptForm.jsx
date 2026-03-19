"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

export function UploadReceiptForm() {
  const { token } = useAuth();
  const [type, setType] = useState("nfce_link");
  const [source, setSource] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      let payload;
      if (file) {
        payload = new FormData();
        payload.append("type", type);
        if (source) payload.append("source", source);
        payload.append("file", file);
      } else {
        payload = { type, source };
      }

      const response = await api.uploadReceipt(token, payload);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate title="Entre para importar seus cupons fiscais">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="glass rounded-[24px] p-5">
          <h2 className="text-2xl font-semibold">Upload de cupom</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Aceita PDF, imagem, XML e link NFC-e. O ideal no celular e mandar foto ou link.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Tipo de entrada
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              >
                <option value="nfce_link">Link NFC-e</option>
                <option value="xml">XML</option>
                <option value="pdf">PDF</option>
                <option value="image">Imagem</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Conteudo ou URL
              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="min-h-32 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                placeholder="Cole o link NFC-e ou XML. Se for arquivo, este campo pode ficar vazio."
              />
            </label>
            <label className="grid gap-2 text-sm">
              Arquivo do cupom
              <input
                type="file"
                accept=".xml,.pdf,image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button disabled={loading} className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Processando..." : "Processar cupom"}
            </button>
          </div>
        </form>

        <div className="glass rounded-[24px] p-5">
          <h2 className="text-2xl font-semibold">Saida estruturada</h2>
          {!result ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Assim que um cupom for enviado, aqui aparecem itens extraidos, normalizacao e metadados da compra.
            </p>
          ) : (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold">{result.parsedReceipt.storeName}</p>
                <p className="text-[var(--muted)]">
                  {result.parsedReceipt.purchaseDate} • Total R$ {result.parsedReceipt.totalValue}
                </p>
              </div>
              {result.parsedReceipt.items.map((item) => (
                <article key={`${item.originalName}-${item.unitPrice}`} className="rounded-2xl bg-[var(--panel-strong)] p-4">
                  <p className="font-semibold">{item.normalizedProductName}</p>
                  <p className="mt-1 text-[var(--muted)]">{item.originalName}</p>
                  <p className="mt-2">
                    {item.quantity} x R$ {item.unitPrice} = R$ {item.totalPrice}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

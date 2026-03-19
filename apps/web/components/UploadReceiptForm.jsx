"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function UploadReceiptForm() {
  const { token } = useAuth();
  const [type, setType] = useState("pdf");
  const [source, setSource] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

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

  function handleFileChange(nextFile) {
    setFile(nextFile);
    if (!nextFile) return;
    setType(detectTypeFromFile(nextFile));
  }

  return (
    <AuthGate title="Importe seus cupons fiscais">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <form onSubmit={handleSubmit} className="glass rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Upload</p>
          <h2 className="mt-3 text-3xl font-semibold">Importe PDF, imagem, XML ou link NFC-e</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            O sistema tenta ler o documento automaticamente, extrair os itens e salvar tudo no banco do seu espaco.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Tipo de entrada
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              >
                <option value="pdf">PDF</option>
                <option value="image">Imagem</option>
                <option value="xml">XML</option>
                <option value="nfce_link">Link NFC-e</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              Conteudo ou URL
              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="min-h-32 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                placeholder="Cole aqui o XML ou o link da NFC-e. Se for PDF ou imagem, este campo pode ficar vazio."
              />
            </label>

            <label className="grid gap-2 text-sm">
              Arquivo do cupom
              <input
                type="file"
                accept=".xml,.pdf,image/*"
                onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
              />
            </label>

            {file ? (
              <div className="rounded-[20px] bg-[var(--panel-strong)] p-4 text-sm text-[var(--muted)]">
                <p className="font-semibold text-[var(--ink)]">{file.name}</p>
                <p className="mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-700">{error}</p> : null}

            <button
              disabled={loading}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Lendo e estruturando cupom..." : "Processar cupom"}
            </button>
          </div>
        </form>

        <div className="glass rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Resultado</p>
          {!result ? (
            <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
              <div className="rounded-[22px] bg-[var(--panel-strong)] p-4">
                O sistema vai tentar identificar loja, data, total, itens, quantidades e precos unitarios.
              </div>
              <div className="rounded-[22px] bg-[var(--panel-strong)] p-4">
                Depois, voce pode revisar tudo na aba Dados e corrigir qualquer divergencia.
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-[22px] bg-[var(--panel-strong)] p-4">
                <p className="font-semibold">{result.parsedReceipt.storeName}</p>
                <p className="mt-2 text-[var(--muted)]">{result.parsedReceipt.purchaseDate}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SummaryMetric label="Total" value={money(result.parsedReceipt.totalValue)} />
                  <SummaryMetric label="Itens" value={String(result.parsedReceipt.items.length)} />
                </div>
              </div>

              <div className="max-h-[28rem] space-y-3 overflow-auto pr-1">
                {result.parsedReceipt.items.map((item) => (
                  <article key={`${item.originalName}-${item.unitPrice}-${item.totalPrice}`} className="rounded-[20px] bg-[var(--panel-strong)] p-4">
                    <p className="font-semibold">{item.normalizedProductName}</p>
                    <p className="mt-1 text-[var(--muted)]">{item.originalName}</p>
                    <p className="mt-3">
                      {item.quantity} x {money(item.unitPrice)} = {money(item.totalPrice)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-[18px] bg-white p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function detectTypeFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xml")) return "xml";
  if (name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/")) return "image";

  return "pdf";
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { AuthGate } from "./AuthGate";
import { PurchaseDraftEditor } from "./PurchaseDraftEditor";

const modes = [
  {
    id: "receipt",
    label: "Cupom",
    title: "Importe PDF, imagem, XML ou link NFC-e",
    description: "O sistema tenta ler o documento automaticamente e monta um rascunho revisavel antes de salvar."
  },
  {
    id: "manual",
    label: "Manual",
    title: "Adicione compras menores manualmente",
    description: "Ideal para padaria, feira, farmacia ou compras avulsas que nao valem um cupom completo."
  }
];

export function UploadReceiptForm() {
  const { token } = useAuth();
  const [mode, setMode] = useState("receipt");
  const [type, setType] = useState("pdf");
  const [source, setSource] = useState("");
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (mode === "manual" && !draft) {
      setDraft(createManualDraft());
      setWarnings([]);
    }
  }, [draft, mode]);

  async function handlePreview(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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
      setDraft(response.parsedReceipt);
      setWarnings(response.warnings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(nextDraft) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.createPurchase(token, nextDraft);
      setDraft(response.parsedReceipt);
      setWarnings([]);
      setSuccess("Compra salva no banco e pronta para aparecer no dashboard e nas consultas.");

      if (mode === "receipt") {
        setFile(null);
        setSource("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(nextFile) {
    setFile(nextFile);
    if (!nextFile) return;
    setType(detectTypeFromFile(nextFile));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setWarnings([]);
    setDraft(nextMode === "manual" ? createManualDraft() : null);
  }

  const currentMode = modes.find((entry) => entry.id === mode);

  return (
    <AuthGate title="Registre suas compras">
      <div className="space-y-6">
        <section className="glass rounded-[30px] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--muted)]">Registro de compras</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{currentMode.title}</h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">{currentMode.description}</p>
            </div>
            <div className="inline-flex rounded-full bg-[var(--accent-soft)] p-1">
              {modes.map((entry) => {
                const active = mode === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => switchMode(entry.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      active ? "bg-[var(--ink)] text-white" : "text-[var(--ink)]"
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="glass rounded-[30px] p-6">
            {mode === "receipt" ? (
              <form onSubmit={handlePreview} className="space-y-4">
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

                <button
                  disabled={loading}
                  className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "Lendo cupom..." : "Ler e preparar revisao"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[22px] bg-[var(--panel-strong)] p-5 text-sm text-[var(--muted)]">
                  Preencha os dados essenciais e monte os itens da compra. Quando terminar, salve tudo direto no banco.
                </div>
                <button
                  onClick={() => {
                    setDraft(createManualDraft());
                    setWarnings([]);
                    setSuccess("");
                  }}
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm"
                >
                  Limpar formulario manual
                </button>
              </div>
            )}

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
          </section>

          <section>
            {!draft ? (
              <div className="glass rounded-[30px] p-6 text-sm text-[var(--muted)]">
                {mode === "receipt"
                  ? "Depois da leitura do cupom, os itens aparecerao aqui para revisao antes de salvar."
                  : "A compra manual vai aparecer aqui assim que o modo manual for ativado."}
              </div>
            ) : (
              <PurchaseDraftEditor
                draft={draft}
                onChange={setDraft}
                onSubmit={handleSave}
                submitLabel="Confirmar e salvar no banco"
                saving={saving}
                warnings={warnings}
                successMessage={success}
              />
            )}
          </section>
        </div>
      </div>
    </AuthGate>
  );
}

function createManualDraft() {
  return {
    storeName: "Compra avulsa",
    storeLocation: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    totalValue: 0,
    items: [
      {
        originalName: "",
        normalizedProductName: "",
        category: "Outros",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }
    ]
  };
}

function detectTypeFromFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".xml")) return "xml";
  if (name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/")) return "image";

  return "pdf";
}

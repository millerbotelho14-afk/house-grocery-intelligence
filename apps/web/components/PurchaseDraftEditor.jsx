"use client";

function money(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function PurchaseDraftEditor({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  saving = false,
  warnings = [],
  successMessage = "",
  showSubmit = true
}) {
  const computedTotal = roundMoney(
    (draft.items || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
  );

  return (
    <div className="space-y-4">
      <section className="glass rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Revisao</p>
            <h2 className="mt-2 text-3xl font-semibold">Confira e ajuste antes de salvar</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Edite os dados livremente. O banco so sera atualizado quando voce confirmar.
            </p>
          </div>
          {showSubmit ? (
            <button
              type="button"
              onClick={() => onSubmit(draft)}
              disabled={saving}
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : submitLabel}
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Loja"
            value={draft.storeName}
            onChange={(value) => onChange({ ...draft, storeName: value })}
          />
          <Field
            label="Local"
            value={draft.storeLocation}
            onChange={(value) => onChange({ ...draft, storeLocation: value })}
          />
          <Field
            label="Data"
            type="date"
            value={draft.purchaseDate}
            onChange={(value) => onChange({ ...draft, purchaseDate: value })}
          />
          <Field
            label="Total da compra"
            type="number"
            step="0.01"
            value={draft.totalValue}
            onChange={(value) => onChange({ ...draft, totalValue: Number(value) })}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <span className="rounded-full bg-[var(--panel-strong)] px-3 py-2">
            Soma dos itens: <span className="font-semibold text-[var(--ink)]">{money(computedTotal)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...draft, totalValue: computedTotal })}
            className="rounded-full border border-[var(--line)] px-3 py-2 text-[var(--ink)]"
          >
            Usar soma dos itens
          </button>
        </div>

        {warnings.length ? (
          <div className="mt-5 space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="rounded-[18px] bg-[#fff4ea] px-4 py-3 text-sm text-[#7b4a17]">
                {warning}
              </div>
            ))}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-5 rounded-[18px] bg-[#eef6ee] px-4 py-3 text-sm text-[#245b31]">{successMessage}</div>
        ) : null}
      </section>

      <section className="glass rounded-[30px] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Itens</p>
            <h3 className="mt-2 text-2xl font-semibold">{draft.items.length} item(ns) em revisao</h3>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...draft, items: [...draft.items, blankItem()] })}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
          >
            Adicionar item
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--panel-strong)]">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-sm">
              <thead className="bg-[var(--accent-soft)] text-left text-[var(--muted)]">
                <tr className="border-b border-[var(--line)]">
                  {["Item", "Nome original", "Nome padrao", "Categoria", "Qtd.", "Unitario", "Total", "Comentario", "Acoes"].map(
                    (label) => (
                      <th key={label} className="px-4 py-4 font-medium">
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item, index) => (
                  <tr key={`${index}-${item.originalName}-${item.normalizedProductName}`} className="border-b border-[var(--line)] align-top last:border-b-0">
                    <td className="px-4 py-4 font-medium text-[var(--muted)]">{index + 1}</td>
                    <td className="px-4 py-4">
                      <CellInput
                        value={item.originalName}
                        onChange={(value) => onChange(updateItem(draft, index, { originalName: value }))}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CellInput
                        value={item.normalizedProductName}
                        onChange={(value) => onChange(updateItem(draft, index, { normalizedProductName: value }))}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CellInput
                        value={item.category}
                        onChange={(value) => onChange(updateItem(draft, index, { category: value }))}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CellInput
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(value) =>
                          onChange(recalculateDraftItem(draft, index, { quantity: Number(value) }))
                        }
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CellInput
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(value) =>
                          onChange(recalculateDraftItem(draft, index, { unitPrice: Number(value) }))
                        }
                      />
                    </td>
                    <td className="px-4 py-4">
                      <CellInput
                        type="number"
                        step="0.01"
                        value={item.totalPrice}
                        onChange={(value) =>
                          onChange(recalculateDraftItem(draft, index, { totalPrice: Number(value) }, "total"))
                        }
                      />
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        value={item.userComment || ""}
                        onChange={(event) =>
                          onChange(updateItem(draft, index, { userComment: event.target.value }))
                        }
                        className="min-h-24 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
                        placeholder="Observacoes, divergencias, marca ou anotacoes..."
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...draft,
                            items: draft.items.filter((_, currentIndex) => currentIndex !== index)
                          })
                        }
                        className="rounded-full border border-[var(--line)] px-3 py-2 text-xs"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", step }) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
      />
    </label>
  );
}

function CellInput({ value, onChange, type = "text", step }) {
  return (
    <input
      type={type}
      step={step}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-[120px] rounded-2xl border border-[var(--line)] bg-white px-3 py-2"
    />
  );
}

function updateItem(draft, index, nextPatch) {
  return {
    ...draft,
    items: draft.items.map((item, currentIndex) =>
      currentIndex === index ? { ...item, ...nextPatch } : item
    )
  };
}

function recalculateDraftItem(draft, index, nextPatch, priority = "unit") {
  const nextDraft = updateItem(draft, index, nextPatch);
  const item = nextDraft.items[index];
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unitPrice || 0);
  const totalPrice = Number(item.totalPrice || 0);

  if (priority === "total" && quantity > 0) {
    return updateItem(nextDraft, index, { unitPrice: roundMoney(totalPrice / quantity) });
  }

  return updateItem(nextDraft, index, { totalPrice: roundMoney(quantity * unitPrice) });
}

function blankItem() {
  return {
    originalName: "",
    normalizedProductName: "",
    category: "Outros",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    userComment: ""
  };
}

function roundMoney(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

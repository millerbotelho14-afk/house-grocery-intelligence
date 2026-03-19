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
      <section className="glass rounded-[28px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Revisao</p>
            <h2 className="mt-2 text-3xl font-semibold">Confira os dados antes de salvar</h2>
          </div>
          {showSubmit ? (
            <button
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

      <section className="glass rounded-[28px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Itens</p>
            <h3 className="mt-2 text-2xl font-semibold">{draft.items.length} item(ns) em revisao</h3>
          </div>
          <button onClick={() => onChange({ ...draft, items: [...draft.items, blankItem()] })} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">
            Adicionar item
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {draft.items.map((item, index) => (
            <article key={`${index}-${item.originalName}-${item.normalizedProductName}`} className="rounded-[24px] bg-[var(--panel-strong)] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Item {index + 1}</p>
                <button
                  onClick={() =>
                    onChange({
                      ...draft,
                      items: draft.items.filter((_, currentIndex) => currentIndex !== index)
                    })
                  }
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                >
                  Remover
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Nome original"
                  value={item.originalName}
                  onChange={(value) => onChange(updateItem(draft, index, { originalName: value }))}
                />
                <Field
                  label="Nome padrao"
                  value={item.normalizedProductName}
                  onChange={(value) => onChange(updateItem(draft, index, { normalizedProductName: value }))}
                />
                <Field
                  label="Categoria"
                  value={item.category}
                  onChange={(value) => onChange(updateItem(draft, index, { category: value }))}
                />
                <Field
                  label="Quantidade"
                  type="number"
                  step="0.01"
                  value={item.quantity}
                  onChange={(value) => onChange(recalculateDraftItem(draft, index, { quantity: Number(value) }))}
                />
                <Field
                  label="Preco unitario"
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(value) => onChange(recalculateDraftItem(draft, index, { unitPrice: Number(value) }))}
                />
                <Field
                  label="Preco total"
                  type="number"
                  step="0.01"
                  value={item.totalPrice}
                  onChange={(value) => onChange(recalculateDraftItem(draft, index, { totalPrice: Number(value) }, "total"))}
                />
              </div>
            </article>
          ))}
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
    totalPrice: 0
  };
}

function roundMoney(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}

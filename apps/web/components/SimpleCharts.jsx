export function LineBars({ data }) {
  const max = Math.max(...data.map((item) => item.total), 1);
  return (
    <div className="glass rounded-[24px] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Monthly Spending Chart</h2>
        <span className="text-sm text-[var(--muted)]">Ultimos meses</span>
      </div>
      <div className="flex h-48 items-end gap-4">
        {data.map((item) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-3">
            <div
              className="chart-bar w-full"
              style={{ height: `${Math.max((item.total / max) * 100, 12)}%` }}
            />
            <div className="text-center">
              <p className="text-sm font-semibold">{item.month}</p>
              <p className="text-xs text-[var(--muted)]">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieLegend({ data }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  return (
    <div className="glass rounded-[24px] p-5">
      <h2 className="text-xl font-semibold">Spending by Category</h2>
      <div className="mt-6 space-y-3">
        {data.map((item, index) => {
          const percent = total ? Math.round((item.total / total) * 100) : 0;
          return (
            <div key={item.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.category}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--panel-strong)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percent}%`,
                    background: index % 2 === 0 ? "var(--highlight)" : "var(--accent)"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RankedBars({ title, rows, formatter }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="glass rounded-[24px] p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span>{row.label}</span>
              <span className="font-semibold">{formatter(row.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--panel-strong)]">
              <div
                className="h-full rounded-full bg-[var(--ink)]"
                style={{ width: `${Math.max((row.value / max) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

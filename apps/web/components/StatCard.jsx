export function StatCard({ eyebrow, title, value, detail }) {
  return (
    <article className="glass rounded-[24px] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{eyebrow}</p>
      <h3 className="mt-3 text-lg">{title}</h3>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}

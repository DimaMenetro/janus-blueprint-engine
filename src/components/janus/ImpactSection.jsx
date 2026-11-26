// One group of stage versions in a re-run impact preview (new versions, stale, unchanged…).
export default function ImpactSection({ title, items, note, tone, t }) {
  if (!items.length) return null;
  const border = tone === "warn" ? t.errorBorder : tone === "new" ? t.successBorder : t.surfaceBorder;
  const bg = tone === "warn" ? t.errorBg : tone === "new" ? t.successBg : "transparent";
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.title }}>
        {title} <span style={{ fontWeight: 400, color: t.subtitle }}>({items.length})</span>
      </div>
      {note && <div style={{ fontSize: 11, color: t.subtitle, marginTop: 2 }}>{note}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {items.map(i => (
          <span key={i.id || i.key} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, border: `1px solid ${border}`, background: bg, color: t.text, whiteSpace: "nowrap" }}>
            {i.label} <span style={{ color: t.subtitle }}>{i.revision}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
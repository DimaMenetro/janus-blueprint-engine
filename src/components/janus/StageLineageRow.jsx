import { PAIRS, DOMAINS } from "@/lib/janus/protocolRegistry";
import { intersectionKey, revisionLabel } from "@/lib/janus/stageModel";

const stageLabel = (key) => {
  const pair = PAIRS.find(p => intersectionKey(p.id) === key);
  if (pair) return pair.domains.map(d => DOMAINS[d].label).join(" × ");
  return DOMAINS[key]?.label || key.charAt(0).toUpperCase() + key.slice(1);
};

function Chip({ children, bg, border, color }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: bg, border: `1px solid ${border}`, color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export default function StageLineageRow({ info, t }) {
  const { active, latest, stale } = info;
  const newer = latest && latest.id !== active?.id ? latest : null; // a newer revision that did not succeed

  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "7px 0", borderTop: "1px solid rgba(148,163,184,0.18)" }}>
      <span style={{ flex: "1 1 140px", fontSize: 13, color: t.text }}>{stageLabel(info.key)}</span>
      {active
        ? <Chip bg={t.successBg} border={t.successBorder} color={t.text}>{revisionLabel(active)}</Chip>
        : <Chip bg={t.errorBg} border={t.errorBorder} color={t.text}>no valid revision</Chip>}
      {newer && (
        <Chip bg={newer.status === "failed" ? t.errorBg : "transparent"} border={newer.status === "failed" ? t.errorBorder : t.successBorder} color={t.text}>
          {revisionLabel(newer)} {newer.status}
        </Chip>
      )}
      {stale && <Chip bg="transparent" border={t.errorBorder} color={t.text}>stale</Chip>}
      {stale && <span style={{ flexBasis: "100%", fontSize: 11, color: t.subtitle }}>{stale}</span>}
    </div>
  );
}
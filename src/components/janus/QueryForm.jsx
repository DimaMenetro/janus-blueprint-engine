import React from "react";
import { glassSurface } from "@/components/ui/LiquidGlass";

export default function QueryForm({ value, onChange, t }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: t.title, display: "block", marginBottom: 8 }}>
        Query
      </label>
      <textarea
        placeholder="Enter your natural-language query..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...glassSurface(t),
          width: "100%",
          minHeight: 140,
          resize: "vertical",
          padding: "14px 16px",
          fontSize: 15,
          fontWeight: 500,
          color: t.title,
          outline: "none",
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
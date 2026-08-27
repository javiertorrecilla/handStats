import React from "react";

/**
 * Head-to-Head Horizontal Comparison Bar Component
 * Con títulos de equipo en multilínea y espaciado amplio.
 */
export function HorizontalBarChart({ items = [], homeTeam = "Local", awayTeam = "Visitante" }) {
  return (
    <div className="hs-comparison-container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-16)" }}>
      {/* CABECERA CON NOMBRES DE EQUIPO EN MULTILÍNEA Y ESPACIADO ADECUADO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "var(--space-12)",
          fontWeight: 800,
          fontSize: "0.82rem",
          marginBottom: "var(--space-8)",
          paddingBottom: "var(--space-10)",
          borderBottom: "1px solid var(--border-subtle)",
          lineHeight: "1.3"
        }}
      >
        <div
          style={{
            color: "var(--color-primary)",
            textTransform: "uppercase",
            textAlign: "left",
            wordBreak: "break-word",
            whiteSpace: "normal"
          }}
        >
          {homeTeam}
        </div>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            padding: "0 8px",
            fontWeight: 800
          }}
        >
          MÉTRICA
        </div>
        <div
          style={{
            color: "var(--color-info)",
            textTransform: "uppercase",
            textAlign: "right",
            wordBreak: "break-word",
            whiteSpace: "normal"
          }}
        >
          {awayTeam}
        </div>
      </div>

      {/* FILAS DE MÉTRICAS COMPARATIVAS */}
      {items.map((item, idx) => {
        const homeVal = Number(item.homeValue) || 0;
        const awayVal = Number(item.awayValue) || 0;
        let homePct = 50;
        let awayPct = 50;

        if (homeVal + awayVal > 0) {
          homePct = Math.round((homeVal / (homeVal + awayVal)) * 100);
          awayPct = 100 - homePct;
        }

        return (
          <div key={idx} className="hs-comp-row" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "65px 1fr 65px", alignItems: "center", fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 900, color: "var(--color-primary)", textAlign: "left", fontFamily: "var(--font-mono)" }}>
                {item.homeFormatter ? item.homeFormatter(homeVal) : homeVal}
              </span>
              <span style={{ fontWeight: 700, color: "var(--text-secondary)", textAlign: "center", fontSize: "0.76rem" }}>
                {item.label}
              </span>
              <span style={{ fontWeight: 900, color: "var(--color-info)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                {item.awayFormatter ? item.awayFormatter(awayVal) : awayVal}
              </span>
            </div>

            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--bg-inset)" }}>
              <div style={{ width: `${homePct}%`, background: "var(--color-primary)", transition: "width 0.3s ease" }} />
              <div style={{ width: `${awayPct}%`, background: "var(--color-info)", transition: "width 0.3s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

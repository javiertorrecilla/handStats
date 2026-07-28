import React from "react";

/**
 * Pure SVG Score and xG Timeline Evolution Chart
 */
export function EvolutionChart({ data = [], height = 200, homeTeam = "Local", awayTeam = "Visitante" }) {
  if (!data || data.length === 0) {
    return <div className="hs-chart-placeholder">Esperando eventos para generar línea de evolución...</div>;
  }

  const width = 600;
  const padding = 35;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const maxTime = Math.max(1, data[data.length - 1].time);
  const maxScore = Math.max(5, ...data.map((d) => Math.max(d.local, d.away)));

  const pointsHome = data.map((d) => ({
    x: padding + (d.time / maxTime) * graphWidth,
    y: height - padding - (d.local / maxScore) * graphHeight,
    val: d.local,
    isGoal: d.teamScored === "local" || (d.isGoal && d.teamScored !== "away")
  }));

  const pointsAway = data.map((d) => ({
    x: padding + (d.time / maxTime) * graphWidth,
    y: height - padding - (d.away / maxScore) * graphHeight,
    val: d.away,
    isGoal: d.teamScored === "away"
  }));

  const pathHomeD = pointsHome.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const pathAwayD = pointsAway.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  return (
    <div className="hs-chart-container">
      <div className="hs-chart-legend">
        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>■ {homeTeam}</span>
        <span style={{ color: "var(--color-info)", fontWeight: 700 }}>■ {awayTeam}</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="hs-svg-chart">
        {/* Ejes y rejilla */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-strong)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border-strong)" strokeWidth="1" />

        {/* Línea Local */}
        <path d={pathHomeD} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
        {/* Línea Visitante */}
        <path d={pathAwayD} fill="none" stroke="var(--color-info)" strokeWidth="3" />

        {/* Puntos del marcador: se dibujan únicamente en los momentos que hay gol */}
        {pointsHome.filter((p) => p.isGoal).map((p, i) => (
          <circle key={`h-${i}`} cx={p.x} cy={p.y} r="4" fill="var(--color-primary)" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {pointsAway.filter((p) => p.isGoal).map((p, i) => (
          <circle key={`a-${i}`} cx={p.x} cy={p.y} r="4" fill="var(--color-info)" stroke="#ffffff" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

import React from "react";

/**
 * Pure SVG Momentum Flow Chart (-100 to +100)
 */
export function MomentumChart({ data = [], height = 180, homeTeam = "Local", awayTeam = "Visitante" }) {
  if (!data || data.length === 0) {
    return <div className="hs-chart-placeholder">Esperando acciones registradas para calcular Momentum...</div>;
  }

  const width = 600;
  const padding = 30;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  const centerY = padding + graphHeight / 2;

  const maxTime = Math.max(1, data[data.length - 1].time);

  const points = data.map((d) => {
    const x = padding + (d.time / maxTime) * graphWidth;
    const y = centerY - (d.momentum / 100) * (graphHeight / 2);
    return { x, y, momentum: d.momentum, time: d.time };
  });

  // Generar string SVG d para path
  const pathD = points.reduce((acc, p, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Generar path de área cerrada hacia la línea central
  const areaD = `${pathD} L ${points[points.length - 1].x} ${centerY} L ${points[0].x} ${centerY} Z`;

  return (
    <div className="hs-chart-container">
      <div className="hs-chart-header">
        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>▲ Dominio {homeTeam}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Línea de Neutralidad (0)</span>
        <span style={{ color: "var(--color-info)", fontWeight: 700 }}>▼ Dominio {awayTeam}</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="hs-svg-chart">
        {/* Grilla de fondo */}
        <line x1={padding} y1={centerY} x2={width - padding} y2={centerY} stroke="var(--border-strong)" strokeDasharray="4 4" strokeWidth="1.5" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeWidth="0.5" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="0.5" />

        {/* Área rellenada con gradiente */}
        <defs>
          <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--color-info)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <path d={areaD} fill="url(#momentumGrad)" />
        <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />

        {/* Puntos clave */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={p.momentum >= 0 ? "var(--color-primary)" : "var(--color-info)"} />
        ))}
      </svg>
    </div>
  );
}

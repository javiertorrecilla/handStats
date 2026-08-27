import React from "react";

/**
 * Pure SVG Momentum Flow Chart con escala adaptativa, cuadrícula cada 5 minutos y línea bicolor Verde / Azul.
 */
export function MomentumChart({ data = [], height = 220, homeTeam = "Local", awayTeam = "Visitante" }) {
  if (!data || data.length === 0) {
    return <div className="hs-chart-placeholder">Esperando acciones registradas para calcular Momentum...</div>;
  }

  const width = 600;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;
  const centerY = paddingTop + graphHeight / 2;

  const maxTime = Math.max(3600, data[data.length - 1].time || 3600);

  // Calcular máximo y mínimo de momentum del partido para la escala dinámica
  const allMomentumValues = data.map((d) => d.momentum || 0);
  const rawMax = Math.max(...allMomentumValues, 0);
  const rawMin = Math.min(...allMomentumValues, 0);

  // Límite simétrico adaptable (mínimo 15 para dar margen visual en inicios)
  const maxAbs = Math.max(15, Math.abs(rawMax), Math.abs(rawMin));
  const limitBound = Math.ceil(maxAbs / 5) * 5;

  const points = data.map((d) => {
    const x = paddingLeft + (d.time / maxTime) * graphWidth;
    const y = centerY - (d.momentum / limitBound) * (graphHeight / 2);
    return {
      x,
      y,
      momentum: d.momentum,
      time: d.time
    };
  });

  // Generar string SVG d para path
  const pathD = points.reduce((acc, p, idx) => {
    return `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Generar path de área cerrada hacia la línea central
  const areaD = `${pathD} L ${points[points.length - 1].x} ${centerY} L ${points[0].x} ${centerY} Z`;

  // Intervalos de 5 minutos en el eje X
  const maxMinutes = Math.ceil(maxTime / 60);
  const fiveMinIntervals = [];
  for (let m = 0; m <= maxMinutes; m += 5) {
    const sec = m * 60;
    if (sec <= maxTime || m <= 60) {
      const x = paddingLeft + (sec / maxTime) * graphWidth;
      fiveMinIntervals.push({ min: m, x });
    }
  }

  return (
    <div className="hs-chart-container">
      <div className="hs-chart-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>▲ Dominio {homeTeam} (+{limitBound})</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Línea de Neutralidad (0)</span>
        <span style={{ color: "var(--color-info)", fontWeight: 700 }}>▼ Dominio {awayTeam} (-{limitBound})</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="hs-svg-chart">
        {/* Rejilla de tiempo en Eje X (cada 5 minutos) */}
        {fiveMinIntervals.map((interval) => (
          <g key={`grid-5m-${interval.min}`}>
            <line
              x1={interval.x}
              y1={paddingTop}
              x2={interval.x}
              y2={height - paddingBottom}
              stroke="var(--border-color)"
              strokeDasharray="3 3"
              strokeWidth="0.8"
              opacity="0.6"
            />
            <text
              x={interval.x}
              y={height - paddingBottom + 16}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
              fontWeight="600"
            >
              {interval.min}'
            </text>
          </g>
        ))}

        {/* Grilla de fondo horizontal */}
        <line x1={paddingLeft} y1={centerY} x2={width - paddingRight} y2={centerY} stroke="var(--border-strong)" strokeDasharray="4 4" strokeWidth="1.5" />
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border-color)" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border-color)" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Textos de valores límite en el eje Y */}
        <text x={paddingLeft - 6} y={paddingTop + 4} textAnchor="end" fill="var(--color-primary)" fontSize="10" fontWeight="bold">+{limitBound}</text>
        <text x={paddingLeft - 6} y={centerY + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9">0</text>
        <text x={paddingLeft - 6} y={height - paddingBottom + 3} textAnchor="end" fill="var(--color-info)" fontSize="10" fontWeight="bold">-{limitBound}</text>

        {/* Gradientes SVG para área y línea */}
        <defs>
          <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--color-info)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="momentumLineGrad" x1="0" y1={paddingTop} x2="0" y2={height - paddingBottom} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="50%" stopColor="var(--color-primary)" />
            <stop offset="50%" stopColor="var(--color-info)" />
            <stop offset="100%" stopColor="var(--color-info)" />
          </linearGradient>
        </defs>

        <path d={areaD} fill="url(#momentumGrad)" />
        <path d={pathD} fill="none" stroke="url(#momentumLineGrad)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

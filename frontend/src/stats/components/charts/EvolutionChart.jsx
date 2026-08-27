import React from "react";

/**
 * Pure SVG Score Evolution Chart con escalonado tipo Step-Chart,
 * cuadrícula vertical cada 5 minutos y etiquetas de tiempo.
 */
export function EvolutionChart({ data = [], height = 220, homeTeam = "Local", awayTeam = "Visitante" }) {
  if (!data || data.length === 0) {
    return <div className="hs-chart-placeholder">Esperando eventos para generar línea de evolución...</div>;
  }

  const width = 600;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const maxTime = Math.max(3600, data[data.length - 1].time || 3600);
  const maxScore = Math.max(10, ...data.map((d) => Math.max(d.local || 0, d.away || 0))) + 2;

  const pointsHome = data.map((d) => ({
    x: paddingLeft + (d.time / maxTime) * graphWidth,
    y: height - paddingBottom - ((d.local || 0) / maxScore) * graphHeight,
    local: d.local || 0,
    away: d.away || 0,
    time: d.time,
    isGoal: d.teamScored === "local" || (d.isGoal && d.teamScored !== "away")
  }));

  const pointsAway = data.map((d) => ({
    x: paddingLeft + (d.time / maxTime) * graphWidth,
    y: height - paddingBottom - ((d.away || 0) / maxScore) * graphHeight,
    local: d.local || 0,
    away: d.away || 0,
    time: d.time,
    isGoal: d.teamScored === "away"
  }));

  // Generar trazado tipo Step-Chart (escalonado)
  const buildStepPath = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const curr = pts[i];
      d += ` H ${curr.x} V ${curr.y}`;
    }
    return d;
  };

  const pathHomeD = buildStepPath(pointsHome);
  const pathAwayD = buildStepPath(pointsAway);

  // Áreas con relleno sutil
  const areaHomeD = `${pathHomeD} L ${pointsHome[pointsHome.length - 1].x} ${height - paddingBottom} L ${pointsHome[0].x} ${height - paddingBottom} Z`;
  const areaAwayD = `${pathAwayD} L ${pointsAway[pointsAway.length - 1].x} ${height - paddingBottom} L ${pointsAway[0].x} ${height - paddingBottom} Z`;

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

  // Ticks para el eje Y (Goles)
  const yStep = maxScore <= 12 ? 2 : (maxScore <= 25 ? 5 : 10);
  const yTicks = [];
  for (let s = 0; s <= maxScore; s += yStep) {
    const y = height - paddingBottom - (s / maxScore) * graphHeight;
    yTicks.push({ score: s, y });
  }

  const formatMinSec = (sec) => {
    const m = Math.floor((sec || 0) / 60);
    const s = Math.floor((sec || 0) % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="hs-chart-container">
      <div className="hs-chart-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>■ {homeTeam}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Evolución del Marcador (Goles)</span>
        <span style={{ color: "var(--color-info)", fontWeight: 700 }}>■ {awayTeam}</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="hs-svg-chart">
        <defs>
          <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-info)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

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

        {/* Rejilla horizontal de goles en Eje Y */}
        {yTicks.map((tick) => (
          <g key={`grid-y-${tick.score}`}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke="var(--border-color)"
              strokeWidth="0.5"
              opacity="0.4"
            />
            <text
              x={paddingLeft - 6}
              y={tick.y + 3}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="9"
            >
              {tick.score}
            </text>
          </g>
        ))}

        {/* Ejes base */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border-strong)" strokeWidth="1.5" />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="var(--border-strong)" strokeWidth="1.5" />

        {/* Áreas rellenas */}
        <path d={areaHomeD} fill="url(#homeGrad)" />
        <path d={areaAwayD} fill="url(#awayGrad)" />

        {/* Línea de Marcador Local (Escalonada) */}
        <path d={pathHomeD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinejoin="round" />
        {/* Línea de Marcador Visitante (Escalonada) */}
        <path d={pathAwayD} fill="none" stroke="var(--color-info)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

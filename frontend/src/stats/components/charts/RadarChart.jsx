import React from "react";

/**
 * Pure SVG 5-Axis Radar Chart for Tactical Team/Player Profiles
 * Axes: Eficiencia, Defense, Portería, xG Ratio, Ritmo
 */
export function RadarChart({
  homeValues = [60, 70, 80, 65, 75],
  awayValues = [50, 60, 55, 70, 60],
  labels = ["Eficiencia", "Defensa", "Portería", "xG Generado", "Ritmo"],
  size = 240,
  homeTeam = "Local",
  awayTeam = "Visitante"
}) {
  const center = size / 2;
  const radius = center - 35;
  const numAxes = labels.length;
  const angleStep = (Math.PI * 2) / numAxes;

  const getCoordinates = (value, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Puntos del polígono Local
  const homePoints = homeValues.map((v, i) => getCoordinates(v, i));
  const homePathD = homePoints.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "") + " Z";

  // Puntos del polígono Visitante
  const awayPoints = awayValues.map((v, i) => getCoordinates(v, i));
  const awayPathD = awayPoints.reduce((acc, p, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`, "") + " Z";

  return (
    <div className="hs-radar-container" style={{ textAlign: "center" }}>
      <div className="hs-chart-legend mb-2">
        <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>■ {homeTeam}</span>
        <span style={{ color: "var(--color-info)", fontWeight: 700, marginLeft: 12 }}>■ {awayTeam}</span>
      </div>

      <svg viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size, margin: "0 auto", overflow: "visible" }}>
        {/* Círculos concéntricos de fondo */}
        {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * level}
            fill="none"
            stroke="var(--border-color)"
            strokeDasharray={level < 1.0 ? "2 2" : "none"}
          />
        ))}

        {/* Ejes radiales */}
        {labels.map((label, i) => {
          const endPos = getCoordinates(100, i);
          const labelPos = getCoordinates(120, i);
          return (
            <g key={i}>
              <line x1={center} y1={center} x2={endPos.x} y2={endPos.y} stroke="var(--border-color)" />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--text-secondary)"
                fontSize="10"
                fontWeight="600"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Polígono Local */}
        <path d={homePathD} fill="var(--color-primary)" fillOpacity="0.25" stroke="var(--color-primary)" strokeWidth="2" />
        {/* Polígono Visitante */}
        <path d={awayPathD} fill="var(--color-info)" fillOpacity="0.25" stroke="var(--color-info)" strokeWidth="2" />
      </svg>
    </div>
  );
}

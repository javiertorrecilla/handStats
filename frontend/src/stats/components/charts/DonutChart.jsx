import React from "react";

/**
 * Pure SVG Donut Chart for shot distribution & save rates
 */
export function DonutChart({ segments = [], size = 160, centerLabel = "", centerSub = "" }) {
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const total = Math.max(1, segments.reduce((sum, s) => sum + (s.value || 0), 0));

  let accumulatedAngle = 0;

  return (
    <div className="hs-donut-container" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--bg-inset)" strokeWidth={strokeWidth} />

        {segments.map((seg, i) => {
          const strokeDasharray = `${(seg.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedAngle;
          accumulatedAngle += (seg.value / total) * circumference;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color || "var(--color-primary)"}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          );
        })}

        {centerLabel && (
          <text x={center} y={center - (centerSub ? 5 : 0)} textAnchor="middle" dominantBaseline="central" fill="var(--text-primary)" fontSize="18" fontWeight="800">
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text x={center} y={center + 14} textAnchor="middle" dominantBaseline="central" fill="var(--text-muted)" fontSize="10" fontWeight="600">
            {centerSub}
          </text>
        )}
      </svg>

      <div className="hs-donut-legend" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: seg.color || "var(--color-primary)" }} />
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{seg.label}:</span>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{seg.value} ({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

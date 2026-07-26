import React from "react";

export function KPICard({ title, value, unit = "", delta, trend = "neutral", comparison = "", subtitle, icon }) {
  const getTrendColor = () => {
    if (trend === "up") return "var(--color-primary)";
    if (trend === "down") return "var(--color-danger)";
    return "var(--text-muted)";
  };

  const getTrendArrow = () => {
    if (trend === "up") return "▲";
    if (trend === "down") return "▼";
    return "•";
  };

  return (
    <div className="hs-kpi-card">
      <div className="hs-kpi-header">
        <span className="hs-kpi-title">{title}</span>
        {icon && <span className="hs-kpi-icon">{icon}</span>}
      </div>

      <div className="hs-kpi-body">
        <span className="hs-kpi-value">
          {value}
          {unit && <span className="hs-kpi-unit">{unit}</span>}
        </span>

        {delta && (
          <span className="hs-kpi-delta" style={{ color: getTrendColor() }}>
            {getTrendArrow()} {delta}
          </span>
        )}
      </div>

      {(comparison || subtitle) && (
        <div className="hs-kpi-footer">
          {comparison && <span className="hs-kpi-comparison">{comparison}</span>}
          {subtitle && <span className="hs-kpi-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

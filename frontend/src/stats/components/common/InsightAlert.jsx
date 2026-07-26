import React from "react";
import { IconAlertTriangle, IconCheckCircle, IconLightbulb } from "./Icons";

export function InsightAlert({ insight }) {
  if (!insight) return null;

  const { type, title, message, recommendation } = insight;

  const getBorderColor = () => {
    if (type === "danger" || type === "critical") return "var(--color-danger)";
    if (type === "warning") return "var(--color-warning)";
    if (type === "success") return "var(--color-primary)";
    return "var(--color-info)";
  };

  const getBgColor = () => {
    if (type === "danger" || type === "critical") return "var(--color-danger-subtle)";
    if (type === "warning") return "var(--color-warning-subtle)";
    if (type === "success") return "var(--color-primary-subtle)";
    return "var(--color-info-subtle)";
  };

  const getHeaderIcon = () => {
    if (type === "danger" || type === "critical" || type === "warning") {
      return <IconAlertTriangle size={16} />;
    }
    if (type === "success") {
      return <IconCheckCircle size={16} />;
    }
    return <IconLightbulb size={16} />;
  };

  return (
    <div
      className="hs-insight-alert"
      style={{
        borderLeft: `4px solid ${getBorderColor()}`,
        background: getBgColor()
      }}
    >
      <div className="hs-insight-header" style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
        <span style={{ color: getBorderColor(), display: "inline-flex" }}>{getHeaderIcon()}</span>
        <span className="hs-insight-title">{title}</span>
      </div>
      <p className="hs-insight-message">{message}</p>
      {recommendation && (
        <div className="hs-insight-recommendation" style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-6)" }}>
          <span style={{ color: "var(--color-primary)", display: "inline-flex", marginTop: 2 }}><IconLightbulb size={14} /></span>
          <span><strong>Recomendación:</strong> {recommendation}</span>
        </div>
      )}
    </div>
  );
}

import React from "react";

export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="hs-section-header">
      <div>
        <h3 className="hs-section-title">{title}</h3>
        {subtitle && <p className="hs-section-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="hs-section-actions">{actions}</div>}
    </div>
  );
}

export function MetricBadge({ label, value, variant = "primary" }) {
  const getBadgeStyle = () => {
    if (variant === "success" || variant === "primary") return { bg: "var(--color-primary-subtle)", color: "var(--color-primary)", border: "var(--color-primary-border)" };
    if (variant === "warning") return { bg: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "var(--color-warning-border)" };
    if (variant === "danger") return { bg: "var(--color-danger-subtle)", color: "var(--color-danger)", border: "var(--color-danger-border)" };
    return { bg: "var(--color-info-subtle)", color: "var(--color-info)", border: "var(--color-info-border)" };
  };

  const style = getBadgeStyle();

  return (
    <span
      className="hs-metric-badge"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
      }}
    >
      {label && <span className="hs-badge-label">{label}: </span>}
      <span className="hs-badge-value">{value}</span>
    </span>
  );
}

import React from "react";

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

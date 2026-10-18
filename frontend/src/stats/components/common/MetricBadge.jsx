import React from "react";

export function getRatingBadge(rating) {
  const val = parseFloat(rating);
  if (isNaN(val) || val < 5.0) {
    return { variant: "danger", className: "badge-rating-tier-danger" };
  }
  if (val < 6.0) {
    return { variant: "orange", className: "badge-rating-tier-orange" };
  }
  if (val < 7.0) {
    return { variant: "amber", className: "badge-rating-tier-amber" };
  }
  if (val < 8.0) {
    return { variant: "lime", className: "badge-rating-tier-lime" };
  }
  if (val < 9.0) {
    return { variant: "success", className: "badge-rating-tier-success" };
  }
  return { variant: "mvp", className: "badge-rating-tier-mvp" };
}

export function MetricBadge({ label, value, variant = "primary", className = "", style: customStyle = {} }) {
  const getBadgeStyle = () => {
    if (variant === "danger") return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.40)" };
    if (variant === "orange") return { bg: "rgba(249, 115, 22, 0.16)", color: "#f97316", border: "rgba(249, 115, 22, 0.45)" };
    if (variant === "amber" || variant === "warning") return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.40)" };
    if (variant === "lime") return { bg: "rgba(163, 230, 53, 0.15)", color: "#a3e635", border: "rgba(163, 230, 53, 0.40)" };
    if (variant === "accent" || variant === "light-green") return { bg: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "var(--color-accent-border)" };
    if (variant === "success" || variant === "primary") return { bg: "rgba(68, 216, 120, 0.18)", color: "#44D878", border: "rgba(68, 216, 120, 0.45)" };
    if (variant === "mvp" || variant === "purple") return { bg: "rgba(168, 85, 247, 0.18)", color: "#a855f7", border: "rgba(168, 85, 247, 0.45)" };
    return { bg: "var(--color-info-subtle)", color: "var(--color-info)", border: "var(--color-info-border)" };
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`hs-metric-badge ${className}`.trim()}
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        ...customStyle
      }}
    >
      {label && <span className="hs-badge-label">{label}: </span>}
      <span className="hs-badge-value">{value}</span>
    </span>
  );
}


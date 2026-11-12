import React from "react";
import { resolveWidgetColSpan } from "../../../services/dashboardLayoutService";

/**
 * Renderizador común de rejilla 2D configurable de 12 columnas para todas las secciones
 * estadísticas (Dashboard -> Informe + Equipo).
 * Respeta posición exacta (colStart, rowStart), ancho (colSpan: 2..12), alto (rowSpan: 1..4) y densidad.
 */
export function ConfigurableDashboardGrid({
  widgets = [],
  catalog = [],
  density = "normal",
  renderWidget,
  emptyState = null,
  noOuterContainer = false
}) {
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));
  const visibleItems = widgets
    .filter((w) => w && w.visible !== false && catalogMap.has(w.id))
    .map((w) => ({ config: w, meta: catalogMap.get(w.id) }))
    .sort((a, b) => {
      const rDiff = (Number(a.config.rowStart) || 999) - (Number(b.config.rowStart) || 999);
      if (rDiff !== 0) return rDiff;
      return (Number(a.config.colStart) || 999) - (Number(b.config.colStart) || 999);
    });

  if (visibleItems.length === 0) {
    return emptyState;
  }

  const minRowStart = visibleItems.reduce((min, item) => {
    const r = Number(item.config.rowStart);
    return Number.isFinite(r) && r > 0 ? Math.min(min, r) : min;
  }, Infinity);
  const leadingRowOffset = Number.isFinite(minRowStart) && minRowStart > 1 ? minRowStart - 1 : 0;

  const gridEl = (
    <div className={`hs-custom-free-grid hs-density-${density || "normal"}`}>
      {visibleItems.map(({ config, meta }) => {
        const content = renderWidget(config, meta);
        if (!content) return null;

        const colSpan = resolveWidgetColSpan(config.colSpan ?? config.size, meta.defaultColSpan || 4);
        const rowSpan = Math.max(1, Math.min(4, Math.round(Number(config.rowSpan) || meta.defaultRowSpan || 1)));
        const colStart = Number.isFinite(Number(config.colStart)) ? Number(config.colStart) : null;
        const rawRowStart = Number.isFinite(Number(config.rowStart)) ? Number(config.rowStart) : null;
        const rowStart = rawRowStart ? Math.max(1, rawRowStart - leadingRowOffset) : null;

        const styleVars = {
          "--hs-col-span": colSpan,
          "--hs-row-span": rowSpan,
          ...(colStart ? { "--hs-col-start": colStart } : {}),
          ...(rowStart ? { "--hs-row-start": rowStart } : {})
        };

        return (
          <div
            key={config.id}
            className={`hs-widget-slot hs-free-widget-slot hs-row-span-${rowSpan}`}
            style={styleVars}
          >
            {content}
          </div>
        );
      })}
    </div>
  );

  if (noOuterContainer) {
    return gridEl;
  }

  return <div className="hs-view-container">{gridEl}</div>;
}

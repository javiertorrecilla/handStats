import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GripVertical,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Plus,
  X,
  Cloud,
  HardDrive,
  SlidersHorizontal,
  LayoutGrid,
  Sparkles,
  Wand2
} from "lucide-react";
import { toast } from "../../context/ToastContext";
import { trackEvent } from "../../services/analyticsService";
import { useDashboardLayout } from "../../stats/hooks/useDashboardLayout";
import { StatsDashboardView } from "../../stats/components/views/StatsDashboardView";
import { AttackStatsView } from "../../stats/components/views/AttackStatsView";
import { DefenseStatsView } from "../../stats/components/views/DefenseStatsView";
import { ConfigurableDashboardGrid } from "../../stats/components/common/ConfigurableDashboardGrid";
import {
  DASHBOARD_PRESETS,
  DENSITY_OPTIONS,
  GRID_COLUMNS,
  MAX_COL_SPAN,
  MAX_ROW_SPAN,
  MIN_COL_SPAN,
  MIN_ROW_SPAN,
  SECTION_CATALOGS,
  SECTION_INDEX,
  addWidgetFromSidebar,
  autoPackWidgets,
  clampInt,
  getWidgetCatalogBySection,
  moveItemByOffset,
  moveWidgetToGridPos,
  removeWidgetToSidebar
} from "../../services/dashboardLayoutService";
import "./DashboardCustomizerPage.css";

const ROW_UNIT_PX = 96;
const GRID_GAP_PX = 8;

const SAMPLE_MATCH_METRICS = {
  overview: {
    homeTeam: "Handtix Club",
    awayTeam: "Rival Atlético",
    homeGoals: 31,
    awayGoals: 27,
    homeOffEfficiency: 58,
    awayOffEfficiency: 50,
    homeXG: 29.4,
    awayXG: 27.8,
    homeDefEfficiency: 50,
    awayDefEfficiency: 42,
    homeGKSaves: 14,
    homeGKSavePct: 34,
    awayGKSaves: 10,
    awayGKSavePct: 24,
    homeGKExpectedSaves: 11.2,
    awayGKExpectedSaves: 10.6,
    homeTurnovers: 8,
    awayTurnovers: 11,
    homeSteals: 7,
    awaySteals: 4,
    home2Min: 3,
    away2Min: 4,
    homeYellowCards: 2,
    awayYellowCards: 3,
    homeRedCards: 0,
    awayRedCards: 1,
    homeBlueCards: 0,
    awayBlueCards: 0,
    homeFreeThrows: 12,
    awayFreeThrows: 15,
    homeOffRebounds: 4,
    awayOffRebounds: 2,
    homeDefRebounds: 6,
    awayDefRebounds: 4,
    homePossCount: 53,
    awayPossCount: 54,
    homeAvgPossDuration: 28,
    awayAvgPossDuration: 31,
    homeShotsCount: 45,
    awayShotsCount: 44
  },
  momentumTimeline: [
    { time: 0, momentum: 0, local: 0, away: 0 },
    { time: 600, momentum: 4, local: 6, away: 4 },
    { time: 1200, momentum: -2, local: 10, away: 11 },
    { time: 1800, momentum: 6, local: 16, away: 14 },
    { time: 2400, momentum: 10, local: 22, away: 19 },
    { time: 3000, momentum: 7, local: 26, away: 23 },
    { time: 3600, momentum: 12, local: 31, away: 27 }
  ],
  scoreTimeline: [
    { time: 0, local: 0, away: 0 },
    { time: 600, local: 6, away: 4, teamScored: "local" },
    { time: 1200, local: 10, away: 11, teamScored: "away" },
    { time: 1800, local: 16, away: 14, teamScored: "local" },
    { time: 2400, local: 22, away: 19, teamScored: "local" },
    { time: 3000, local: 26, away: 23, teamScored: "local" },
    { time: 3600, local: 31, away: 27, teamScored: "local" }
  ],
  attackBreakdownHome: {
    totalShots: 45,
    byType: {
      "Primera Línea (9m)": { shots: 16, goals: 8, xg: 6.1 },
      "Extremo": { shots: 11, goals: 8, xg: 6.4 },
      "Pivote": { shots: 10, goals: 8, xg: 7.2 },
      "Contraataque": { shots: 8, goals: 7, xg: 6.4 }
    }
  },
  homePlayerStats: [
    { number: 9, name: "Alejandro García", goals: 8, shotsCount: 11, rating: "8.9", isGoalkeeper: false },
    { number: 1, name: "Gonzalo Pérez", goalkeeperSaves: 14, goalkeeperShotsFaced: 41, rating: "8.5", isGoalkeeper: true },
    { number: 14, name: "Carlos Martín", goals: 6, shotsCount: 9, rating: "8.1", isGoalkeeper: false },
    { number: 7, name: "Lucas Sanz", goals: 5, shotsCount: 7, rating: "7.8", isGoalkeeper: false }
  ]
};

const SAMPLE_INSIGHTS = [
  {
    id: "preview_1",
    type: "success",
    title: "Portería por encima de xSaves",
    message: "El portero supera en +2.8 paradas las esperadas por modelo de tiro.",
    recommendation: "Mantener transición rápida tras parada para castigar repliegue rival."
  }
];

function isSafeInternalRoute(pathStr) {
  if (!pathStr || typeof pathStr !== "string") return false;
  return pathStr.startsWith("/") && !pathStr.startsWith("//");
}

const CATEGORY_GROUP_ORDER = ["kpi", "table", "chart", "insights"];

function getCategoryLabel(category, t) {
  switch (category) {
    case "kpi":
      return t("customize.cat_kpi", "KPI");
    case "chart":
      return t("customize.cat_chart", "GRÁFICO");
    case "table":
      return t("customize.cat_table", "TABLA");
    case "insights":
      return t("customize.cat_insights", "TÁCTICA");
    default:
      return category;
  }
}

function PresetWireframe({ presetId }) {
  if (presetId === "minimalist") {
    return (
      <div className="customizer-preset-mini-wireframe" aria-hidden="true">
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 6", height: 14 }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 6", height: 14 }} />
      </div>
    );
  }
  if (presetId === "goalkeeper_coach") {
    return (
      <div className="customizer-preset-mini-wireframe" aria-hidden="true">
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 6", height: 12 }} />
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 6", height: 12 }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 4" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 4" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 4" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 12", height: 10 }} />
      </div>
    );
  }
  if (presetId === "head_coach") {
    return (
      <div className="customizer-preset-mini-wireframe" aria-hidden="true">
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 12" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 3" }} />
        <div className="customizer-wf-bar accent" style={{ gridColumn: "span 6", height: 12 }} />
        <div className="customizer-wf-bar" style={{ gridColumn: "span 6", height: 12 }} />
      </div>
    );
  }
  return (
    <div className="customizer-preset-mini-wireframe" aria-hidden="true">
      <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
      <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
      <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
      <div className="customizer-wf-bar accent" style={{ gridColumn: "span 3" }} />
      <div className="customizer-wf-bar" style={{ gridColumn: "span 6", height: 10 }} />
      <div className="customizer-wf-bar" style={{ gridColumn: "span 6", height: 10 }} />
      <div className="customizer-wf-bar" style={{ gridColumn: "span 12" }} />
    </div>
  );
}

export default function DashboardCustomizerPage({ matchesList = [] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { layout, isSyncing, isCloudAccount, saveLayout, applyPreset, resetLayout } = useDashboardLayout();

  const searchParams = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const initialSectionParam = searchParams.get("section") || "dashboard";
  const validInitialSection = SECTION_CATALOGS[initialSectionParam] ? initialSectionParam : "dashboard";
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = isSafeInternalRoute(rawReturnTo) ? rawReturnTo : null;

  const [activeSection, setActiveSection] = useState(validInitialSection);
  const [viewMode, setViewMode] = useState("studio"); // "studio" | "preview"
  const [draft, setDraft] = useState(layout);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);
  const [sidebarCategoryFilter, setSidebarCategoryFilter] = useState("all");

  // Estado Drag & Drop libre en espacio blanco <-> barra lateral
  const [dragPayload, setDragPayload] = useState(null); // { id, source: "sheet" | "sidebar", colSpan, rowSpan }
  const [dropGhost, setDropGhost] = useState(null); // { colStart, rowStart, colSpan, rowSpan }
  const [isOverSidebarDrop, setIsOverSidebarDrop] = useState(false);

  // Estado Resize interactivo por bordes seleccionables
  const [resizingWidgetId, setResizingWidgetId] = useState(null);

  const whiteGridRef = useRef(null);
  const cloudDebounceRef = useRef(null);
  const resizeCleanupRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    setDraft(layout);
  }, [layout]);

  useEffect(() => {
    if (SECTION_CATALOGS[initialSectionParam]) {
      setActiveSection(initialSectionParam);
      setSelectedWidgetId(null);
      setSidebarCategoryFilter("all");
    }
  }, [initialSectionParam]);

  useEffect(() => {
    return () => {
      if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
      if (resizeCleanupRef.current) resizeCleanupRef.current();
    };
  }, []);

  const commitLayoutChange = (nextLayout) => {
    setDraft(nextLayout);
    saveLayout(nextLayout, { localOnly: true });

    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    cloudDebounceRef.current = setTimeout(() => {
      saveLayout(nextLayout);
    }, 450);
  };

  const sectionConfig = draft.sections?.[activeSection] || {
    organization: "unified",
    density: "normal",
    widgets: []
  };

  const sectionMeta = SECTION_INDEX.find((s) => s.id === activeSection) || SECTION_INDEX[0];
  const catalog = getWidgetCatalogBySection(activeSection);
  const catalogMap = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);

  const placedWidgets = useMemo(
    () =>
      (sectionConfig.widgets || [])
        .filter((w) => w.visible !== false && catalogMap.has(w.id))
        .sort((a, b) => (a.rowStart - b.rowStart) || (a.colStart - b.colStart)),
    [sectionConfig.widgets, catalogMap]
  );

  const unplacedWidgets = useMemo(
    () => (sectionConfig.widgets || []).filter((w) => w.visible === false && catalogMap.has(w.id)),
    [sectionConfig.widgets, catalogMap]
  );

  const unplacedGroups = useMemo(() => {
    const byCat = new Map();
    unplacedWidgets.forEach((w) => {
      const meta = catalogMap.get(w.id);
      if (!meta) return;
      const cat = meta.category || "other";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push({ widget: w, meta });
    });

    const orderedKeys = [
      ...CATEGORY_GROUP_ORDER.filter((cat) => byCat.has(cat)),
      ...Array.from(byCat.keys()).filter((cat) => !CATEGORY_GROUP_ORDER.includes(cat))
    ];

    return orderedKeys.map((cat) => ({
      category: cat,
      items: byCat.get(cat)
    }));
  }, [unplacedWidgets, catalogMap]);

  const activeCategoryFilter =
    sidebarCategoryFilter === "all" || unplacedGroups.some((g) => g.category === sidebarCategoryFilter)
      ? sidebarCategoryFilter
      : "all";

  const visibleUnplacedGroups = useMemo(() => {
    if (activeCategoryFilter === "all") return unplacedGroups;
    return unplacedGroups.filter((g) => g.category === activeCategoryFilter);
  }, [unplacedGroups, activeCategoryFilter]);

  // Construir orden dinámico del índice combinando orden personalizado de secciones estadísticas
  const orderedIndexItems = useMemo(() => {
    const matchTabsOrder = draft.matchTabs || [];
    const indexById = new Map(SECTION_INDEX.map((s) => [s.id, s]));
    return matchTabsOrder
      .map((tab) => {
        const meta = indexById.get(tab.id);
        return meta ? { ...meta, tabVisible: tab.visible !== false } : null;
      })
      .filter(Boolean);
  }, [draft.matchTabs]);

  const updateCurrentSection = (updater, markCustomPreset = true) => {
    const latestDraft = draftRef.current;
    const curSection = latestDraft.sections?.[activeSection] || sectionConfig;
    const nextSection = typeof updater === "function" ? updater(curSection) : updater;

    const nextSections = {
      ...latestDraft.sections,
      [activeSection]: nextSection
    };

    const nextLayout = {
      ...latestDraft,
      activePreset: markCustomPreset ? "custom" : latestDraft.activePreset,
      sections: nextSections,
      matchDashboard: {
        ...nextSections.dashboard,
        tabs: latestDraft.matchTabs
      }
    };

    commitLayoutChange(nextLayout);
  };

  // ---- INTERACCIONES DE ÍNDICE Y PESTAÑAS DE PARTIDO ----

  const handleToggleMatchTab = (tabId, e) => {
    e.stopPropagation();
    const currentTabs = draft.matchTabs || [];
    const visibleCount = currentTabs.filter((item) => item.visible !== false).length;
    const target = currentTabs.find((item) => item.id === tabId);
    if (target && target.visible !== false && visibleCount <= 1) {
      toast.warning(t("customize.min_one_tab", "Debe haber al menos una pestaña de estadísticas visible."));
      return;
    }

    const nextTabs = currentTabs.map((item) =>
      item.id === tabId ? { ...item, visible: item.visible === false } : item
    );

    commitLayoutChange({
      ...draft,
      activePreset: "custom",
      matchTabs: nextTabs,
      matchDashboard: { ...draft.matchDashboard, tabs: nextTabs }
    });
  };

  const handleMoveMatchTab = (tabId, offset, e) => {
    e.stopPropagation();
    const nextTabs = moveItemByOffset(draft.matchTabs || [], tabId, offset);
    commitLayoutChange({
      ...draft,
      activePreset: "custom",
      matchTabs: nextTabs,
      matchDashboard: { ...draft.matchDashboard, tabs: nextTabs }
    });
  };

  // ---- INTERACCIONES DE DRAG & DROP SOBRE ESPACIO BLANCO Y BARRA LATERAL ----

  const computeDropCoordsFromPointer = (clientX, clientY, spanCols = 4, spanRows = 1) => {
    const gridEl = whiteGridRef.current;
    if (!gridEl) return { colStart: 1, rowStart: 1, colSpan: spanCols, rowSpan: spanRows };
    const rect = gridEl.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
    const relY = Math.max(0, clientY - rect.top);

    const rawCol = Math.floor((relX / Math.max(1, rect.width)) * GRID_COLUMNS) + 1;
    const safeColSpan = clampInt(spanCols, MIN_COL_SPAN, MAX_COL_SPAN, 4);
    const safeRowSpan = clampInt(spanRows, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);

    const colStart = clampInt(rawCol, 1, GRID_COLUMNS - safeColSpan + 1, 1);
    const rowStart = Math.max(1, Math.floor(relY / (ROW_UNIT_PX + GRID_GAP_PX)) + 1);

    return { colStart, rowStart, colSpan: safeColSpan, rowSpan: safeRowSpan };
  };

  const handleSheetDragOver = (e) => {
    if (!dragPayload) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const coords = computeDropCoordsFromPointer(
      e.clientX,
      e.clientY,
      dragPayload.colSpan,
      dragPayload.rowSpan
    );
    setDropGhost(coords);
  };

  const handleSheetDrop = (e) => {
    e.preventDefault();
    if (!dragPayload) return;

    const coords = computeDropCoordsFromPointer(
      e.clientX,
      e.clientY,
      dragPayload.colSpan,
      dragPayload.rowSpan
    );

    if (dragPayload.source === "sidebar") {
      updateCurrentSection((sec) => addWidgetFromSidebar(sec, dragPayload.id, coords));
    } else {
      updateCurrentSection((sec) => moveWidgetToGridPos(sec, dragPayload.id, coords));
    }

    setSelectedWidgetId(dragPayload.id);
    setDragPayload(null);
    setDropGhost(null);
  };

  const handleSidebarDrop = (e) => {
    e.preventDefault();
    setIsOverSidebarDrop(false);
    if (!dragPayload || dragPayload.source !== "sheet") return;
    updateCurrentSection((sec) => removeWidgetToSidebar(sec, dragPayload.id));
    if (selectedWidgetId === dragPayload.id) setSelectedWidgetId(null);
    setDragPayload(null);
    setDropGhost(null);
  };

  // ---- REDIMENSIONADO POR BORDES SELECCIONABLES (DERECHO, INFERIOR, ESQUINA) ----

  const startBorderResize = (widget, axis, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (resizeCleanupRef.current) resizeCleanupRef.current();

    setSelectedWidgetId(widget.id);
    setResizingWidgetId(widget.id);

    const gridEl = whiteGridRef.current;
    const gridRect = gridEl ? gridEl.getBoundingClientRect() : { width: 840 };
    const colPx = Math.max(24, gridRect.width / GRID_COLUMNS);
    const rowPx = ROW_UNIT_PX + GRID_GAP_PX;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialColSpan = clampInt(widget.colSpan, MIN_COL_SPAN, MAX_COL_SPAN, 4);
    const initialRowSpan = clampInt(widget.rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);

    let lastColSpan = initialColSpan;
    let lastRowSpan = initialRowSpan;

    const handlePointerMove = (moveEv) => {
      const deltaX = moveEv.clientX - startX;
      const deltaY = moveEv.clientY - startY;

      let nextColSpan = initialColSpan;
      let nextRowSpan = initialRowSpan;

      if (axis === "x" || axis === "xy") {
        const colDelta = Math.round(deltaX / colPx);
        const maxPossibleForStart = GRID_COLUMNS - (widget.colStart || 1) + 1;
        nextColSpan = clampInt(
          initialColSpan + colDelta,
          MIN_COL_SPAN,
          Math.max(MIN_COL_SPAN, Math.min(MAX_COL_SPAN, maxPossibleForStart)),
          initialColSpan
        );
      }

      if (axis === "y" || axis === "xy") {
        const rowDelta = Math.round(deltaY / rowPx);
        nextRowSpan = clampInt(initialRowSpan + rowDelta, MIN_ROW_SPAN, MAX_ROW_SPAN, initialRowSpan);
      }

      if (nextColSpan !== lastColSpan || nextRowSpan !== lastRowSpan) {
        lastColSpan = nextColSpan;
        lastRowSpan = nextRowSpan;
        updateCurrentSection((sec) =>
          moveWidgetToGridPos(sec, widget.id, {
            colStart: widget.colStart,
            rowStart: widget.rowStart,
            colSpan: nextColSpan,
            rowSpan: nextRowSpan
          })
        );
      }
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("pointercancel", cleanup);
      setResizingWidgetId(null);
      resizeCleanupRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
    resizeCleanupRef.current = cleanup;
  };

  // ---- PRESETS, AUTO-ORDEN, GUARDAR Y RESTABLECER ----

  const handlePresetClick = async (presetId) => {
    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    const res = await applyPreset(presetId);
    setDraft(res.layout);
    setSelectedWidgetId(null);
    trackEvent("dashboard_preset_applied", { preset_id: presetId });
    const presetMeta = DASHBOARD_PRESETS.find((p) => p.id === presetId);
    toast.success(
      t("customize.preset_applied", {
        name: t(presetMeta?.labelKey, presetMeta?.defaultLabel || presetId),
        defaultValue: `Modelo "${presetMeta?.defaultLabel || presetId}" aplicado.`
      })
    );
  };

  const handleAutoPackSection = () => {
    updateCurrentSection((sec) => ({
      ...sec,
      widgets: autoPackWidgets(sec.widgets)
    }));
    toast.success(t("customize.autopack_done", "Estadísticas ordenadas limpiamente en la rejilla."));
  };

  const handleExplicitSave = async () => {
    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    const res = await saveLayout(draft);
    trackEvent("dashboard_layout_saved", {
      section: activeSection,
      preset: draft?.activePreset || "custom",
      cloud_synced: Boolean(res?.syncedCloud)
    });
    if (res?.syncedCloud) {
      toast.success(t("customize.save_cloud_success", "Diseño personalizado guardado y sincronizado en tu cuenta."));
    } else {
      toast.success(t("customize.save_local_success", "Diseño personalizado guardado en este navegador."));
    }
  };

  const handleReset = async () => {
    if (!confirm(t("customize.reset_confirm", "¿Restablecer todos los dashboards al diseño original de Handtix Pro?"))) {
      return;
    }
    if (cloudDebounceRef.current) clearTimeout(cloudDebounceRef.current);
    const res = await resetLayout();
    setDraft(res.layout);
    setSelectedWidgetId(null);
    toast.success(t("customize.reset_success", "Dashboards restablecidos al diseño original."));
  };

  const maxRowUsed = placedWidgets.reduce(
    (max, w) => Math.max(max, (w.rowStart || 1) + (w.rowSpan || 1) - 1),
    1
  );
  const sheetRowsCount = Math.max(4, maxRowUsed + 1);
  const guideCellsCount = sheetRowsCount * GRID_COLUMNS;

  const renderSectionPreview = () => {
    if (activeSection === "dashboard") {
      return (
        <StatsDashboardView
          metrics={SAMPLE_MATCH_METRICS}
          insights={SAMPLE_INSIGHTS}
          teamFilter="home"
          matchesList={matchesList}
          dashboardConfig={sectionConfig}
        />
      );
    }
    if (activeSection === "attack") {
      return <AttackStatsView metrics={SAMPLE_MATCH_METRICS} teamFilter="home" sectionConfig={sectionConfig} />;
    }
    if (activeSection === "defense") {
      return <DefenseStatsView metrics={SAMPLE_MATCH_METRICS} teamFilter="home" sectionConfig={sectionConfig} />;
    }
    return (
      <ConfigurableDashboardGrid
        widgets={sectionConfig.widgets}
        catalog={catalog}
        density={sectionConfig.density}
        renderWidget={(cfg, meta) => (
          <div className="hs-card">
            <h4 className="hs-card-title">{t(meta.titleKey, meta.defaultTitle)}</h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {t(meta.descKey, meta.defaultDesc)}
            </p>
            <div style={{ marginTop: 10, fontSize: "0.72rem", fontWeight: 700, color: "var(--color-primary)" }}>
              {cfg.colSpan}/12 cols · {cfg.rowSpan} {cfg.rowSpan === 1 ? "fila" : "filas"}
            </div>
          </div>
        )}
      />
    );
  };

  return (
    <div className="customizer-page">
      {/* CABECERA SUPERIOR */}
      <div className="customizer-header">
        <div className="customizer-title-group">
          <div className="customizer-title-row">
            {returnTo && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate(returnTo)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <ArrowLeft size={14} />
                <span>{t("customize.back_to_view", "Volver a Estadísticas")}</span>
              </button>
            )}
            <h2>
              <SlidersHorizontal size={22} color="var(--color-primary)" />
              <span>{t("customize.title", "Personalización de Dashboard y Estadísticas")}</span>
            </h2>
            <span className={`customizer-sync-pill ${isSyncing ? "syncing" : isCloudAccount ? "synced" : ""}`}>
              {isCloudAccount ? <Cloud size={13} /> : <HardDrive size={13} />}
              <span>
                {isSyncing
                  ? t("customize.syncing_cloud", "Sincronizando con la nube...")
                  : isCloudAccount
                    ? t("customize.synced_cloud", "Sincronizado en tu cuenta")
                    : t("customize.saved_local_only", "Guardado local (Invitado)")}
              </span>
            </span>
          </div>
          <p className="customizer-subtitle">
            {t(
              "customize.subtitle",
              "Elige un modelo predeterminado, selecciona cualquier sección estadística desde Dashboard hasta Cronología, y coloca o redimensiona libremente cada estadística en el espacio blanco."
            )}
          </p>
        </div>

        <div className="customizer-header-actions">
          <button type="button" className="btn btn-secondary" onClick={handleReset} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={15} />
            <span>{t("customize.reset_btn", "Restablecer")}</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExplicitSave} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Save size={15} />
            <span>{t("customize.save_btn", "Guardar y Sincronizar")}</span>
          </button>
        </div>
      </div>

      {/* BLOQUE 1: MODELOS PREDETERMINADOS DE SELECCIÓN */}
      <div className="customizer-section-block">
        <h3 className="customizer-section-title">
          <Sparkles size={14} color="var(--color-primary)" />
          <span>{t("customize.presets_title", "1. Modelos Predeterminados de Selección")}</span>
        </h3>
        <div className="customizer-presets-grid">
          {DASHBOARD_PRESETS.map((preset) => {
            const isActive = draft.activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`customizer-preset-card ${isActive ? "active" : ""}`}
                onClick={() => handlePresetClick(preset.id)}
              >
                <div className="customizer-preset-head">
                  <span className="customizer-preset-title">{t(preset.labelKey, preset.defaultLabel)}</span>
                  {isActive && (
                    <span className="customizer-preset-badge">{t("customize.active_badge", "Activo")}</span>
                  )}
                </div>
                <PresetWireframe presetId={preset.id} />
                <span className="customizer-preset-desc">{t(preset.descKey, preset.defaultDesc)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BLOQUE 2: ÍNDICE DE TODAS LAS ESTADÍSTICAS (DE DASHBOARD A INFORME + EQUIPO) */}
      <div className="customizer-index-panel">
        <div className="customizer-index-header">
          <h3 className="customizer-section-title">
            <LayoutGrid size={14} color="var(--color-primary)" />
            <span>{t("customize.index_title", "2. Índice de Secciones Estadísticas (de Dashboard a Cronología)")}</span>
          </h3>
          <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
            {t("customize.index_hint", "Selecciona cualquier sección para editar su diseño en el espacio blanco inferior.")}
          </span>
        </div>

        <div className="customizer-index-grid">
          {orderedIndexItems.map((secItem, idx) => {
            const secCatalog = getWidgetCatalogBySection(secItem.id);
            const secData = draft.sections?.[secItem.id];
            const placedCount = (secData?.widgets || []).filter((w) => w.visible !== false).length;
            const isActive = activeSection === secItem.id;
            const matchIdx = secItem.isMatchTab
              ? (draft.matchTabs || []).findIndex((m) => m.id === secItem.id)
              : -1;
            const matchTabsLen = (draft.matchTabs || []).length;

            return (
              <div
                key={secItem.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveSection(secItem.id);
                  setSelectedWidgetId(null);
                  setSidebarCategoryFilter("all");
                  setViewMode("studio");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSection(secItem.id);
                    setSelectedWidgetId(null);
                    setSidebarCategoryFilter("all");
                    setViewMode("studio");
                  }
                }}
                className={`customizer-index-item ${isActive ? "active" : ""} ${!secItem.tabVisible ? "is-hidden-tab" : ""}`}
              >
                <div className="customizer-index-top">
                  <span className="customizer-index-num">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="customizer-index-count">
                    {placedCount}/{secCatalog.length}
                  </span>
                </div>
                <div className="customizer-index-name">{t(secItem.labelKey, secItem.defaultLabel)}</div>

                {secItem.isMatchTab && (
                  <div className="customizer-index-controls" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        className="customizer-mini-icon-btn"
                        disabled={matchIdx <= 0}
                        onClick={(e) => handleMoveMatchTab(secItem.id, -1, e)}
                        title={t("customize.move_earlier", "Mover pestaña antes")}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        type="button"
                        className="customizer-mini-icon-btn"
                        disabled={matchIdx < 0 || matchIdx >= matchTabsLen - 1}
                        onClick={(e) => handleMoveMatchTab(secItem.id, 1, e)}
                        title={t("customize.move_later", "Mover pestaña después")}
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="customizer-mini-icon-btn"
                      onClick={(e) => handleToggleMatchTab(secItem.id, e)}
                      title={secItem.tabVisible ? t("customize.hide_tab", "Ocultar pestaña") : t("customize.show_tab", "Mostrar pestaña")}
                      style={secItem.tabVisible ? { color: "var(--color-primary)" } : undefined}
                    >
                      {secItem.tabVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOQUE 3: ESPACIO BLANCO CON BORDES SELECCIONABLES + BARRA LATERAL NO PUESTAS */}
      {viewMode === "preview" ? (
        <div className="customizer-preview-wrapper">
          <div className="customizer-white-toolbar" style={{ borderColor: "var(--border-color)", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                {t("customize.mode_preview", "Vista Previa en Vivo")} — {t(sectionMeta.labelKey, sectionMeta.defaultLabel)}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {t("customize.preview_desc", "Simulación interactiva con el tamaño, posición libre y densidad configurados.")}
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewMode("studio")}>
              {t("customize.back_to_editor", "Volver al Espacio Blanco")}
            </button>
          </div>
          {renderSectionPreview()}
        </div>
      ) : (
        <div className="customizer-studio-workspace">
          {/* PANEL PRINCIPAL: ESPACIO BLANCO */}
          <div className="customizer-white-studio">
            <div className="customizer-white-toolbar">
              <div className="customizer-white-title-block">
                <h3 className="customizer-white-title">
                  <span>{t(sectionMeta.labelKey, sectionMeta.defaultLabel)}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#166534" }}>
                    {placedWidgets.length} {t("customize.placed_label", "colocadas")}
                  </span>
                </h3>
                <p className="customizer-white-sub">
                  {t(sectionMeta.descKey, sectionMeta.defaultDesc)} · {t("customize.white_sheet_hint", "Haz clic en una tarjeta para seleccionar su borde y arrastra los tiradores para cambiar su tamaño.")}
                </p>
              </div>

              <div className="customizer-white-actions">
                <div className="customizer-white-pill-group" title={t("customize.density_title", "Densidad Visual")}>
                  {DENSITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`customizer-white-pill ${sectionConfig.density === opt.id ? "active" : ""}`}
                      onClick={() => updateCurrentSection((sec) => ({ ...sec, density: opt.id }))}
                    >
                      {t(opt.labelKey, opt.defaultLabel)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="customizer-inspector-btn"
                  onClick={handleAutoPackSection}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px" }}
                  title={t("customize.autopack_tooltip", "Reagrupar huecos automáticamente")}
                >
                  <Wand2 size={13} />
                  <span>{t("customize.autopack_btn", "Auto-ajustar")}</span>
                </button>

                <button
                  type="button"
                  className="customizer-inspector-btn"
                  onClick={() => setViewMode("preview")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px" }}
                >
                  <Eye size={13} />
                  <span>{t("customize.mode_preview", "Vista Previa")}</span>
                </button>
              </div>
            </div>


            {/* REGLA NUMERADA DE 12 COLUMNAS */}
            <div className="customizer-col-ruler" aria-hidden="true">
              {Array.from({ length: GRID_COLUMNS }, (_, i) => (
                <div key={i} className="customizer-ruler-tick">
                  C{i + 1}
                </div>
              ))}
            </div>

            {/* ESPACIO BLANCO CON CUADRÍCULA 2D Y DROPS LIBRES */}
            <div
              className={`customizer-white-sheet ${dragPayload ? "is-receiving-drop" : ""}`}
              onDragOver={handleSheetDragOver}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDropGhost(null);
                }
              }}
              onDrop={handleSheetDrop}
              onClick={() => setSelectedWidgetId(null)}
            >
              {placedWidgets.length === 0 && (
                <div className="customizer-white-empty-overlay">
                  <LayoutGrid size={28} color="#94a3b8" />
                  <strong style={{ fontSize: "0.9rem", color: "#334155" }}>
                    {t("customize.white_sheet_empty_title", "Espacio blanco vacío")}
                  </strong>
                  <span style={{ fontSize: "0.76rem", maxWidth: 360 }}>
                    {t("customize.white_sheet_empty_desc", "Arrastra estadísticas desde la barra lateral derecha hacia cualquier lugar de este espacio blanco.")}
                  </span>
                </div>
              )}

              <div
                ref={whiteGridRef}
                className="customizer-white-grid"
                style={{ minHeight: sheetRowsCount * (ROW_UNIT_PX + GRID_GAP_PX) }}
              >
                {/* Celdas guía visuales de fondo */}
                {Array.from({ length: guideCellsCount }, (_, cellIdx) => {
                  const row = Math.floor(cellIdx / GRID_COLUMNS) + 1;
                  const col = (cellIdx % GRID_COLUMNS) + 1;
                  return (
                    <div
                      key={`g_${row}_${col}`}
                      className="customizer-guide-cell"
                      style={{ gridColumn: col, gridRow: row }}
                      aria-hidden="true"
                    />
                  );
                })}

                {/* Silueta verde de previsualización al arrastrar */}
                {dropGhost && (
                  <div
                    className="customizer-drop-ghost"
                    style={{
                      gridColumn: `${dropGhost.colStart} / span ${dropGhost.colSpan}`,
                      gridRow: `${dropGhost.rowStart} / span ${dropGhost.rowSpan}`
                    }}
                  >
                    Col {dropGhost.colStart} · {dropGhost.colSpan}×{dropGhost.rowSpan}
                  </div>
                )}

                {/* Tarjetas colocadas con borde seleccionable para tamaño */}
                {placedWidgets.map((w) => {
                  const meta = catalogMap.get(w.id);
                  if (!meta) return null;
                  const isSelected = selectedWidgetId === w.id;
                  const isDragging = dragPayload?.id === w.id && dragPayload?.source === "sheet";
                  const isResizing = resizingWidgetId === w.id;

                  return (
                    <div
                      key={w.id}
                      draggable={!isResizing}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWidgetId(w.id);
                      }}
                      onDragStart={(e) => {
                        if (isResizing) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedWidgetId(w.id);
                        setDragPayload({
                          id: w.id,
                          source: "sheet",
                          colSpan: w.colSpan,
                          rowSpan: w.rowSpan
                        });
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", w.id);
                      }}
                      onDragEnd={() => {
                        setDragPayload(null);
                        setDropGhost(null);
                        setIsOverSidebarDrop(false);
                      }}
                      className={`customizer-sheet-card ${isSelected ? "selected" : ""} ${isDragging ? "is-dragging" : ""} ${isResizing ? "is-resizing" : ""}`}
                      style={{
                        gridColumn: `${w.colStart} / span ${w.colSpan}`,
                        gridRow: `${w.rowStart} / span ${w.rowSpan}`
                      }}
                    >
                      <div className="customizer-sheet-card-top">
                        <div className="customizer-sheet-grip-wrap">
                          <GripVertical size={15} style={{ color: "#94a3b8", flexShrink: 0, marginTop: 1 }} />
                          <div style={{ minWidth: 0 }}>
                            <div className="customizer-sheet-title">{t(meta.titleKey, meta.defaultTitle)}</div>
                            {w.rowSpan >= 2 && (
                              <div className="customizer-sheet-desc" style={{ marginTop: 4 }}>
                                {t(meta.descKey, meta.defaultDesc)}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="customizer-sheet-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCurrentSection((sec) => removeWidgetToSidebar(sec, w.id));
                            if (selectedWidgetId === w.id) setSelectedWidgetId(null);
                          }}
                          title={t("customize.hide_widget", "Quitar a barra lateral")}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div className="customizer-sheet-meta-row">
                        <span className={`customizer-cat-pill cat-${meta.category}`}>
                          {getCategoryLabel(meta.category, t)}
                        </span>
                        <span className="customizer-sheet-dim-badge">
                          {w.colSpan}/12 × {w.rowSpan}f
                        </span>
                      </div>

                      {/* BORDES Y ESQUINA SELECCIONABLES PARA REDIMENSIONAR */}
                      <div
                        className="customizer-resize-edge-right"
                        title={t("customize.resize_width_hint", "Arrastra el borde derecho para cambiar el ancho")}
                        onPointerDown={(e) => startBorderResize(w, "x", e)}
                      />
                      <div
                        className="customizer-resize-edge-bottom"
                        title={t("customize.resize_height_hint", "Arrastra el borde inferior para cambiar la altura")}
                        onPointerDown={(e) => startBorderResize(w, "y", e)}
                      />
                      <div
                        className="customizer-resize-corner"
                        title={t("customize.resize_corner_hint", "Arrastra la esquina para ajustar ancho y alto")}
                        onPointerDown={(e) => startBorderResize(w, "xy", e)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BARRA LATERAL DERECHA: ESTADÍSTICAS NO PUESTAS (DRAG & DROP) */}
          <aside
            className={`customizer-sidebar-tray ${isOverSidebarDrop ? "is-drop-remove" : ""}`}
            onDragOver={(e) => {
              if (dragPayload?.source === "sheet") {
                e.preventDefault();
                setIsOverSidebarDrop(true);
              }
            }}
            onDragLeave={() => setIsOverSidebarDrop(false)}
            onDrop={handleSidebarDrop}
          >
            <div className="customizer-tray-header">
              <h4 className="customizer-tray-title">
                {t("customize.sidebar_unplaced_title", "Estadísticas sin colocar")}
              </h4>
              <span className="customizer-index-num">{unplacedWidgets.length}</span>
            </div>

            <p className="customizer-tray-hint">
              {t(
                "customize.sidebar_unplaced_hint",
                "Arrastra cualquier estadística al espacio blanco o pulsa + para añadirla. También puedes soltar aquí tarjetas para quitarlas."
              )}
            </p>

            {unplacedWidgets.length === 0 ? (
              <div className="hs-chart-placeholder" style={{ padding: 18 }}>
                {t("customize.all_widgets_visible", "Todas las estadísticas de esta sección están colocadas en el espacio blanco.")}
              </div>
            ) : (
              <>
                {unplacedGroups.length > 1 && (
                  <div className="customizer-tray-filters" role="tablist" aria-label={t("common.filter", "Filtro")}>
                    <button
                      type="button"
                      className={`customizer-tray-filter-chip ${activeCategoryFilter === "all" ? "active" : ""}`}
                      onClick={() => setSidebarCategoryFilter("all")}
                    >
                      <span>{t("common.all", "Todos")}</span>
                      <span className="customizer-tray-chip-count">{unplacedWidgets.length}</span>
                    </button>
                    {unplacedGroups.map((group) => (
                      <button
                        key={group.category}
                        type="button"
                        className={`customizer-tray-filter-chip cat-${group.category} ${activeCategoryFilter === group.category ? "active" : ""}`}
                        onClick={() => setSidebarCategoryFilter(group.category)}
                      >
                        <span>{getCategoryLabel(group.category, t)}</span>
                        <span className="customizer-tray-chip-count">{group.items.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="customizer-tray-groups">
                  {visibleUnplacedGroups.map((group) => (
                    <div key={group.category} className="customizer-tray-group">
                      <div className="customizer-tray-group-header">
                        <span className={`customizer-cat-pill cat-${group.category}`}>
                          {getCategoryLabel(group.category, t)}
                        </span>
                        <span className="customizer-tray-group-count">
                          {group.items.length}
                        </span>
                      </div>

                      <div className="customizer-tray-list">
                        {group.items.map(({ widget: w, meta }) => (
                          <div
                            key={w.id}
                            draggable
                            onDragStart={(e) => {
                              setDragPayload({
                                id: w.id,
                                source: "sidebar",
                                colSpan: w.colSpan || meta.defaultColSpan || 4,
                                rowSpan: w.rowSpan || meta.defaultRowSpan || 1
                              });
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", w.id);
                            }}
                            onDragEnd={() => {
                              setDragPayload(null);
                              setDropGhost(null);
                            }}
                            className="customizer-tray-item"
                          >
                            <div className="customizer-tray-item-top">
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                                <GripVertical size={15} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
                                <div>
                                  <div className="customizer-tray-item-title">{t(meta.titleKey, meta.defaultTitle)}</div>
                                  <div className="customizer-tray-item-desc">{t(meta.descKey, meta.defaultDesc)}</div>
                                </div>
                              </div>
                            </div>

                            <div className="customizer-tray-item-foot">
                              <span className={`customizer-cat-pill cat-${meta.category}`}>
                                {getCategoryLabel(meta.category, t)} · {w.colSpan || meta.defaultColSpan}×{w.rowSpan || meta.defaultRowSpan}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  updateCurrentSection((sec) => addWidgetFromSidebar(sec, w.id));
                                  setSelectedWidgetId(w.id);
                                }}
                                style={{ padding: "3px 9px", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <Plus size={12} />
                                <span>{t("customize.add_btn", "Colocar")}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

/**
 * dashboardLayoutService.js
 * Motor completo de personalización libre de Dashboards y Estadísticas (Handtix Pro).
 *
 * Soporta:
 * - Modelos predeterminados (Presets) globales
 * - Índice completo de secciones estadísticas de partido (Dashboard -> Cronología)
 * - Colocación libre en rejilla 2D de 12 columnas (colStart, rowStart, colSpan, rowSpan)
 * - Redimensionado personalizado por bordes/handles con resolución automática de colisiones
 * - Estadísticas colocadas vs barra lateral de estadísticas no puestas (Drag & Drop)
 */

export const DASHBOARD_LAYOUT_VERSION = 2;
export const DASHBOARD_LAYOUT_EVENT = "handtix_dashboard_layout_updated";
export const GRID_COLUMNS = 12;
export const MIN_COL_SPAN = 2;
export const MAX_COL_SPAN = 12;
export const MIN_ROW_SPAN = 1;
export const MAX_ROW_SPAN = 4;

export const WIDGET_SIZE_SPANS = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 8,
  full: 12
};

export const WIDGET_SIZE_OPTIONS = [
  { id: "xs", span: 3, labelKey: "customize.size_xs", defaultLabel: "1/4 (3)" },
  { id: "sm", span: 4, labelKey: "customize.size_sm", defaultLabel: "1/3 (4)" },
  { id: "md", span: 6, labelKey: "customize.size_md", defaultLabel: "1/2 (6)" },
  { id: "lg", span: 8, labelKey: "customize.size_lg", defaultLabel: "2/3 (8)" },
  { id: "full", span: 12, labelKey: "customize.size_full", defaultLabel: "100% (12)" }
];

export const DENSITY_OPTIONS = [
  { id: "compact", labelKey: "customize.density_compact", defaultLabel: "Compacta" },
  { id: "normal", labelKey: "customize.density_normal", defaultLabel: "Equilibrada" },
  { id: "expanded", labelKey: "customize.density_expanded", defaultLabel: "Espaciada" }
];

export const MATCH_TAB_CATALOG = [
  { id: "dashboard", labelKey: "dashboard.tab_dashboard", defaultLabel: "Resumen General", defaultVisible: true },
  { id: "attack", labelKey: "dashboard.tab_attack", defaultLabel: "Ataque", defaultVisible: true },
  { id: "defense", labelKey: "dashboard.tab_defense", defaultLabel: "Defensa", defaultVisible: true },
  { id: "heatmaps", labelKey: "dashboard.tab_heatmaps", defaultLabel: "Mapas de Calor", defaultVisible: true },
  { id: "goalkeeper", labelKey: "dashboard.tab_goalkeeper", defaultLabel: "Portería", defaultVisible: true },
  { id: "players", labelKey: "dashboard.tab_players", defaultLabel: "Jugadores", defaultVisible: true },
  { id: "chronology", labelKey: "dashboard.tab_chronology", defaultLabel: "Cronología", defaultVisible: true }
];

export const SECTION_INDEX = [
  { id: "dashboard", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_dashboard", defaultLabel: "Resumen General", descKey: "customize.sec_dashboard_desc", defaultDesc: "KPIs ejecutivos, momentum, evolución y comparativa H2H" },
  { id: "attack", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_attack", defaultLabel: "Ataque", descKey: "customize.sec_attack_desc", defaultDesc: "Eficiencia de tiro, tipos de lanzamiento y situaciones numéricas" },
  { id: "defense", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_defense", defaultLabel: "Defensa", descKey: "customize.sec_defense_desc", defaultDesc: "Golpes franco, exclusiones, robos, rebotes y eficiencia" },
  { id: "heatmaps", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_heatmaps", defaultLabel: "Mapas de Calor", descKey: "customize.sec_heatmaps_desc", defaultDesc: "Mapa térmico continuo de lanzamientos en pista y portería" },
  { id: "goalkeeper", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_goalkeeper", defaultLabel: "Portería", descKey: "customize.sec_goalkeeper_desc", defaultDesc: "Paradas, xSaves, comparativa individual y mapa de portería" },
  { id: "players", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_players", defaultLabel: "Jugadores", descKey: "customize.sec_players_desc", defaultDesc: "Tabla completa de plantilla y líderes individuales del partido" },
  { id: "chronology", scope: "match", isMatchTab: true, labelKey: "dashboard.tab_chronology", defaultLabel: "Cronología", descKey: "customize.sec_chronology_desc", defaultDesc: "Filtros de eventos, resumen rápido y timeline completo" }
];

// =========================================================================
// CATÁLOGOS DE ESTADÍSTICAS POR SECCIÓN (DE DASHBOARD A CRONOLOGÍA)
// =========================================================================

export const MATCH_WIDGET_CATALOG = [
  { id: "kpi_off_eff", category: "kpi", titleKey: "customize.widgets.kpi_off_eff", descKey: "customize.widgets.kpi_off_eff_desc", defaultTitle: "Eficiencia Ofensiva (%)", defaultDesc: "Porcentaje de goles por posesión y comparativa con promedio histórico.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_xg", category: "kpi", titleKey: "customize.widgets.kpi_xg", descKey: "customize.widgets.kpi_xg_desc", defaultTitle: "Expected Goals (xG)", defaultDesc: "Calidad acumulada de lanzamientos frente a goles reales.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_possessions", category: "kpi", titleKey: "customize.widgets.kpi_possessions", descKey: "customize.widgets.kpi_possessions_desc", defaultTitle: "Posesiones Totales", defaultDesc: "Volumen total de ataques iniciados y ritmo respecto al global.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_poss_time", category: "kpi", titleKey: "customize.widgets.kpi_poss_time", descKey: "customize.widgets.kpi_poss_time_desc", defaultTitle: "Tiempo Medio de Posesión", defaultDesc: "Duración promedio en segundos de cada ataque.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_free_throws", category: "kpi", titleKey: "customize.widgets.kpi_free_throws", descKey: "customize.widgets.kpi_free_throws_desc", defaultTitle: "Golpes Franco", defaultDesc: "Total de golpes franco cometidos/registrados y delta global.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_def_eff", category: "kpi", titleKey: "customize.widgets.kpi_def_eff", descKey: "customize.widgets.kpi_def_eff_desc", defaultTitle: "Eficiencia Defensiva (%)", defaultDesc: "Porcentaje de ataques rivales frenados.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_saves", category: "kpi", titleKey: "customize.widgets.kpi_saves", descKey: "customize.widgets.kpi_saves_desc", defaultTitle: "Paradas Portería (%)", defaultDesc: "Efectividad en portería del equipo y paradas totales.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_xsaves", category: "kpi", titleKey: "customize.widgets.kpi_xsaves", descKey: "customize.widgets.kpi_xsaves_desc", defaultTitle: "Expected Saves (xSaves)", defaultDesc: "Paradas esperadas según dificultad de los lanzamientos recibidos.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "kpi_turnovers", category: "kpi", titleKey: "customize.widgets.kpi_turnovers", descKey: "customize.widgets.kpi_turnovers_desc", defaultTitle: "Pérdidas de Balón", defaultDesc: "Total de pérdidas no forzadas y diferencia frente al histórico.", defaultVisible: true, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "kpi_off_rebounds", category: "kpi", titleKey: "customize.widgets.kpi_off_rebounds", descKey: "customize.widgets.kpi_off_rebounds_desc", defaultTitle: "Rebotes Ofensivos", defaultDesc: "Segundas oportunidades capturadas tras lanzamiento ofensivo.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "kpi_def_rebounds", category: "kpi", titleKey: "customize.widgets.kpi_def_rebounds", descKey: "customize.widgets.kpi_def_rebounds_desc", defaultTitle: "Rebotes Defensivos", defaultDesc: "Rebotes asegurados en defensa tras parada o lanzamiento rival.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "kpi_steals", category: "kpi", titleKey: "customize.widgets.kpi_steals", descKey: "customize.widgets.kpi_steals_desc", defaultTitle: "Recuperaciones", defaultDesc: "Balones recuperados en fase defensiva.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "kpi_discipline", category: "kpi", titleKey: "customize.widgets.kpi_discipline", descKey: "customize.widgets.kpi_discipline_desc", defaultTitle: "Exclusiones (2')", defaultDesc: "Exclusiones de 2 minutos recibidas por el equipo.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "kpi_cards", category: "kpi", titleKey: "customize.widgets.kpi_cards", descKey: "customize.widgets.kpi_cards_desc", defaultTitle: "Sanciones (Amarillas, Rojas y Azules)", defaultDesc: "Tarjetas amarillas, rojas y azules mostradas al equipo.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "chart_momentum", category: "chart", titleKey: "customize.widgets.chart_momentum", descKey: "customize.widgets.chart_momentum_desc", defaultTitle: "Gráfico Momentum del Partido", defaultDesc: "Flujo dinámico minuto a minuto con rachas e inflexiones.", defaultVisible: true, defaultColSpan: 6, defaultRowSpan: 2 },
  { id: "chart_evolution", category: "chart", titleKey: "customize.widgets.chart_evolution", descKey: "customize.widgets.chart_evolution_desc", defaultTitle: "Evolución de Marcador", defaultDesc: "Progresión acumulada de goles de ambos equipos.", defaultVisible: true, defaultColSpan: 6, defaultRowSpan: 2 },
  { id: "chart_h2h", category: "chart", titleKey: "customize.widgets.chart_h2h", descKey: "customize.widgets.chart_h2h_desc", defaultTitle: "Comparativa Cara a Cara", defaultDesc: "Barras horizontales de posesiones, eficiencia, portería y disciplina.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 2 },
  { id: "block_insights", category: "insights", titleKey: "customize.widgets.block_insights", descKey: "customize.widgets.block_insights_desc", defaultTitle: "Alertas e Insights Tácticos", defaultDesc: "Recomendaciones automáticas generadas por el motor de partido.", defaultVisible: false, defaultColSpan: 12, defaultRowSpan: 1 },
  { id: "block_top_players", category: "table", titleKey: "customize.widgets.block_top_players", descKey: "customize.widgets.block_top_players_desc", defaultTitle: "Top Jugadores por Rating", defaultDesc: "Clasificación rápida de los 5 jugadores más determinantes del partido.", defaultVisible: false, defaultColSpan: 6, defaultRowSpan: 2 }
];

export const ATTACK_WIDGET_CATALOG = [
  { id: "atk_kpi_shots", category: "kpi", titleKey: "customize.widgets.atk_kpi_shots", descKey: "customize.widgets.atk_kpi_shots_desc", defaultTitle: "Lanzamientos Totales", defaultDesc: "Volumen total de tiros y goles convertidos.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "atk_kpi_efficiency", category: "kpi", titleKey: "customize.widgets.atk_kpi_efficiency", descKey: "customize.widgets.atk_kpi_efficiency_desc", defaultTitle: "Eficiencia de Tiro (%)", defaultDesc: "Porcentaje de acierto en finalizaciones.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "atk_kpi_xg", category: "kpi", titleKey: "customize.widgets.atk_kpi_xg", descKey: "customize.widgets.atk_kpi_xg_desc", defaultTitle: "Expected Goals (xG) en Ataque", defaultDesc: "Goles esperados según zonas y situaciones de tiro.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "atk_kpi_turnovers", category: "kpi", titleKey: "customize.widgets.atk_kpi_turnovers", descKey: "customize.widgets.atk_kpi_turnovers_desc", defaultTitle: "Pérdidas en Ataque", defaultDesc: "Balones perdidos durante posesión ofensiva.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "atk_kpi_rebounds", category: "kpi", titleKey: "customize.widgets.atk_kpi_rebounds", descKey: "customize.widgets.atk_kpi_rebounds_desc", defaultTitle: "Rebotes Ofensivos", defaultDesc: "Segundas oportunidades capturadas tras lanzamiento.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "atk_chart_donut", category: "chart", titleKey: "customize.widgets.atk_chart_donut", descKey: "customize.widgets.atk_chart_donut_desc", defaultTitle: "Gráfico Distribución por Tipo de Tiro", defaultDesc: "Donut interactivo por fase/tipo de finalización.", defaultVisible: true, defaultColSpan: 6, defaultRowSpan: 2 },
  { id: "atk_table_types", category: "table", titleKey: "customize.widgets.atk_table_types", descKey: "customize.widgets.atk_table_types_desc", defaultTitle: "Tabla de Eficiencia por Tipo de Tiro", defaultDesc: "Tiros, goles, % eficacia y xG desglosado.", defaultVisible: true, defaultColSpan: 6, defaultRowSpan: 2 },
  { id: "atk_table_situations", category: "table", titleKey: "customize.widgets.atk_table_situations", descKey: "customize.widgets.atk_table_situations_desc", defaultTitle: "Tabla de Situaciones Numéricas (6vs6 / 7vs6)", defaultDesc: "Rendimiento en igualdad, superioridad, inferioridad y portería vacía.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 2 }
];

export const DEFENSE_WIDGET_CATALOG = [
  { id: "def_kpi_free_throws", category: "kpi", titleKey: "customize.widgets.def_kpi_free_throws", descKey: "customize.widgets.def_kpi_free_throws_desc", defaultTitle: "Golpes Franco", defaultDesc: "Acciones defensivas sancionadas con golpe franco.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "def_kpi_two_min", category: "kpi", titleKey: "customize.widgets.def_kpi_two_min", descKey: "customize.widgets.def_kpi_two_min_desc", defaultTitle: "Exclusiones (2 Min)", defaultDesc: "Sanciones temporales recibidas en el encuentro.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "def_kpi_turnovers_forced", category: "kpi", titleKey: "customize.widgets.def_kpi_turnovers_forced", descKey: "customize.widgets.def_kpi_turnovers_forced_desc", defaultTitle: "Pérdidas Provocadas al Rival", defaultDesc: "Errores forzados en el ataque contrario.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "def_kpi_efficiency", category: "kpi", titleKey: "customize.widgets.def_kpi_efficiency", descKey: "customize.widgets.def_kpi_efficiency_desc", defaultTitle: "Eficiencia Defensiva (%)", defaultDesc: "Porcentaje de ataques rivales frenados sin gol.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "def_kpi_steals", category: "kpi", titleKey: "customize.widgets.def_kpi_steals", descKey: "customize.widgets.def_kpi_steals_desc", defaultTitle: "Recuperaciones", defaultDesc: "Recuperaciones limpias de balón en fase defensiva.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "def_kpi_rebounds", category: "kpi", titleKey: "customize.widgets.def_kpi_rebounds", descKey: "customize.widgets.def_kpi_rebounds_desc", defaultTitle: "Rebotes Defensivos", defaultDesc: "Rebotes asegurados tras parada o poste rival.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 },
  { id: "def_kpi_cards", category: "kpi", titleKey: "customize.widgets.def_kpi_cards", descKey: "customize.widgets.def_kpi_cards_desc", defaultTitle: "Sanciones (Amarillas, Rojas y Azules)", defaultDesc: "Tarjetas amarillas, rojas y azules registradas en el partido.", defaultVisible: false, defaultColSpan: 4, defaultRowSpan: 1 }
];

export const HEATMAPS_WIDGET_CATALOG = [
  { id: "hm_combined_court", category: "chart", titleKey: "customize.widgets.hm_combined_court", descKey: "customize.widgets.hm_combined_court_desc", defaultTitle: "Mapa de Calor Continuo (Pista y Portería)", defaultDesc: "Mapa espacial completo interactivo de tiros, goles y portería.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 3 }
];

export const GOALKEEPER_WIDGET_CATALOG = [
  { id: "gk_kpi_saves", category: "kpi", titleKey: "customize.widgets.gk_kpi_saves", descKey: "customize.widgets.gk_kpi_saves_desc", defaultTitle: "Paradas Totales y %", defaultDesc: "Paradas realizadas y efectividad sobre tiros recibidos.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "gk_kpi_xsaves", category: "kpi", titleKey: "customize.widgets.gk_kpi_xsaves", descKey: "customize.widgets.gk_kpi_xsaves_desc", defaultTitle: "Expected Saves (xSaves)", defaultDesc: "Paradas esperadas por el modelo según dificultad zonal.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "gk_kpi_diff", category: "kpi", titleKey: "customize.widgets.gk_kpi_diff", descKey: "customize.widgets.gk_kpi_diff_desc", defaultTitle: "Diferencia Saves vs xSaves", defaultDesc: "Aportación neta por encima o debajo de lo esperado.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "gk_kpi_conceded", category: "kpi", titleKey: "customize.widgets.gk_kpi_conceded", descKey: "customize.widgets.gk_kpi_conceded_desc", defaultTitle: "Goles Encajados", defaultDesc: "Total de goles recibidos en portería.", defaultVisible: true, defaultColSpan: 3, defaultRowSpan: 1 },
  { id: "gk_table_performance", category: "table", titleKey: "customize.widgets.gk_table_performance", descKey: "customize.widgets.gk_table_performance_desc", defaultTitle: "Tabla de Rendimiento de Porteros", defaultDesc: "Desglose clicable por guardameta con tiros, paradas, xSaves y rating.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 2 },
  { id: "gk_goal_heatmap", category: "chart", titleKey: "customize.widgets.gk_goal_heatmap", descKey: "customize.widgets.gk_goal_heatmap_desc", defaultTitle: "Mapa de Calor de Portería (3x3)", defaultDesc: "Distribución de paradas y goles recibidos por cuadrante.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 3 }
];

export const PLAYERS_WIDGET_CATALOG = [
  { id: "pl_table_roster", category: "table", titleKey: "customize.widgets.pl_table_roster", descKey: "customize.widgets.pl_table_roster_desc", defaultTitle: "Tabla Completa de Jugadores y Porteros", defaultDesc: "Estadísticas ordenables por columna con detalle de rating por jugador.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 3 },
  { id: "pl_kpi_mvp", category: "kpi", titleKey: "customize.widgets.pl_kpi_mvp", descKey: "customize.widgets.pl_kpi_mvp_desc", defaultTitle: "MVP del Equipo (Mayor Rating)", defaultDesc: "Jugador con mejor valoración técnica del partido.", defaultVisible: false, defaultColSpan: 6, defaultRowSpan: 1 },
  { id: "pl_kpi_top_scorer", category: "kpi", titleKey: "customize.widgets.pl_kpi_top_scorer", descKey: "customize.widgets.pl_kpi_top_scorer_desc", defaultTitle: "Máximo Goleador del Partido", defaultDesc: "Jugador con más goles anotados y eficacia.", defaultVisible: false, defaultColSpan: 6, defaultRowSpan: 1 }
];

export const CHRONOLOGY_WIDGET_CATALOG = [
  { id: "chr_timeline", category: "table", titleKey: "customize.widgets.chr_timeline", descKey: "customize.widgets.chr_timeline_desc", defaultTitle: "Timeline Cronológico con Filtros Integrados", defaultDesc: "Listado minuto a minuto con barra de filtros por acción integrada.", defaultVisible: true, defaultColSpan: 12, defaultRowSpan: 3 },
  { id: "chr_kpi_summary", category: "kpi", titleKey: "customize.widgets.chr_kpi_summary", descKey: "customize.widgets.chr_kpi_summary_desc", defaultTitle: "Conteo Rápido de Eventos", defaultDesc: "Resumen numérico de goles, paradas, pérdidas y sanciones.", defaultVisible: false, defaultColSpan: 12, defaultRowSpan: 1 }
];

export const SECTION_CATALOGS = {
  dashboard: MATCH_WIDGET_CATALOG,
  attack: ATTACK_WIDGET_CATALOG,
  defense: DEFENSE_WIDGET_CATALOG,
  heatmaps: HEATMAPS_WIDGET_CATALOG,
  goalkeeper: GOALKEEPER_WIDGET_CATALOG,
  players: PLAYERS_WIDGET_CATALOG,
  chronology: CHRONOLOGY_WIDGET_CATALOG
};

export function getWidgetCatalogBySection(sectionId) {
  return SECTION_CATALOGS[sectionId] || MATCH_WIDGET_CATALOG;
}

export function getWidgetCatalogByScope(scopeOrSection) {
  if (SECTION_CATALOGS[scopeOrSection]) return SECTION_CATALOGS[scopeOrSection];
  return MATCH_WIDGET_CATALOG;
}

// =========================================================================
// MOTOR 2D DE REJILLA LIBRE (COLOCACIÓN Y TAMAÑO PERSONALIZADO)
// =========================================================================

export function clampInt(val, min, max, fallback) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

export function spanToLegacySize(colSpan) {
  if (colSpan <= 3) return "xs";
  if (colSpan <= 4) return "sm";
  if (colSpan <= 6) return "md";
  if (colSpan <= 9) return "lg";
  return "full";
}

export function legacySizeToSpan(size, fallback = 4) {
  return WIDGET_SIZE_SPANS[size] || fallback;
}

export function rectsOverlap(a, b) {
  return (
    a.colStart < b.colStart + b.colSpan &&
    a.colStart + a.colSpan > b.colStart &&
    a.rowStart < b.rowStart + b.rowSpan &&
    a.rowStart + a.rowSpan > b.rowStart
  );
}

export function findFirstFreeSlot(placedWidgets = [], colSpan = 4, rowSpan = 1, maxCols = GRID_COLUMNS) {
  const safeW = clampInt(colSpan, MIN_COL_SPAN, maxCols, 4);
  const safeH = clampInt(rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);

  for (let row = 1; row <= 80; row += 1) {
    for (let col = 1; col <= maxCols - safeW + 1; col += 1) {
      const candidate = { colStart: col, rowStart: row, colSpan: safeW, rowSpan: safeH };
      const collides = placedWidgets.some((other) => rectsOverlap(candidate, other));
      if (!collides) {
        return { colStart: col, rowStart: row };
      }
    }
  }
  return { colStart: 1, rowStart: 1 };
}

/**
 * Resuelve colisiones tras mover o redimensionar un widget anclado (`pinnedId`).
 * El widget anclado permanece exactamente en sus coordenadas, y los demás que choquen
 * se desplazan limpiamente hacia abajo sin solapamientos.
 */
export function resolveGridCollisions(widgets = [], pinnedId = null, maxCols = GRID_COLUMNS) {
  const visible = widgets.filter((w) => w.visible !== false);
  const hidden = widgets.filter((w) => w.visible === false);

  const normalizedVisible = visible.map((w) => {
    const colSpan = clampInt(w.colSpan, MIN_COL_SPAN, maxCols, 4);
    const rowSpan = clampInt(w.rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);
    const colStart = clampInt(w.colStart, 1, maxCols - colSpan + 1, 1);
    const rowStart = clampInt(w.rowStart, 1, 100, 1);
    return {
      ...w,
      colSpan,
      rowSpan,
      colStart,
      rowStart,
      size: spanToLegacySize(colSpan),
      height: rowSpan >= 2 ? "tall" : (w.height || "normal")
    };
  });

  const accepted = [];
  const pinned = pinnedId ? normalizedVisible.find((w) => w.id === pinnedId) : null;
  if (pinned) {
    accepted.push(pinned);
  }

  const others = normalizedVisible
    .filter((w) => w.id !== pinnedId)
    .sort((a, b) => (a.rowStart - b.rowStart) || (a.colStart - b.colStart));

  others.forEach((item) => {
    const candidate = { ...item };
    let guard = 0;
    while (accepted.some((other) => rectsOverlap(candidate, other)) && guard < 100) {
      candidate.rowStart += 1;
      guard += 1;
    }
    accepted.push(candidate);
  });

  accepted.sort((a, b) => (a.rowStart - b.rowStart) || (a.colStart - b.colStart));
  return [...accepted, ...hidden];
}

/**
 * Auto-empaqueta una secuencia de widgets (visible y ocultos) en coordenadas 2D limpias de 12 columnas.
 */
export function autoPackWidgets(widgets = [], maxCols = GRID_COLUMNS) {
  const placed = [];
  const hidden = [];

  widgets.forEach((w) => {
    const colSpan = clampInt(w.colSpan, MIN_COL_SPAN, maxCols, 4);
    const rowSpan = clampInt(w.rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);

    if (w.visible === false) {
      hidden.push({
        ...w,
        visible: false,
        colSpan,
        rowSpan,
        colStart: clampInt(w.colStart, 1, maxCols - colSpan + 1, 1),
        rowStart: clampInt(w.rowStart, 1, 100, 1),
        size: spanToLegacySize(colSpan),
        height: rowSpan >= 2 ? "tall" : (w.height || "normal")
      });
      return;
    }

    const slot = findFirstFreeSlot(placed, colSpan, rowSpan, maxCols);
    placed.push({
      ...w,
      visible: true,
      colSpan,
      rowSpan,
      colStart: slot.colStart,
      rowStart: slot.rowStart,
      size: spanToLegacySize(colSpan),
      height: rowSpan >= 2 ? "tall" : (w.height || "normal")
    });
  });

  return [...placed, ...hidden];
}

function buildSectionWidgetsFromCatalog(catalog, overrides = {}) {
  const rawList = [];
  const seen = new Set();

  // Primero colocar los explícitamente ordenados en overrides
  Object.entries(overrides).forEach(([id, ov]) => {
    const meta = catalog.find((c) => c.id === id);
    if (!meta || seen.has(id)) return;
    seen.add(id);
    const colSpan = clampInt(ov.colSpan ?? legacySizeToSpan(ov.size, meta.defaultColSpan), MIN_COL_SPAN, MAX_COL_SPAN, meta.defaultColSpan);
    const rowSpan = clampInt(ov.rowSpan ?? (ov.height === "tall" ? 2 : meta.defaultRowSpan), MIN_ROW_SPAN, MAX_ROW_SPAN, meta.defaultRowSpan);
    rawList.push({
      id: meta.id,
      visible: ov.visible ?? meta.defaultVisible,
      colStart: ov.colStart,
      rowStart: ov.rowStart,
      colSpan,
      rowSpan
    });
  });

  catalog.forEach((meta) => {
    if (seen.has(meta.id)) return;
    rawList.push({
      id: meta.id,
      visible: meta.defaultVisible,
      colSpan: meta.defaultColSpan,
      rowSpan: meta.defaultRowSpan
    });
  });

  const hasExplicitCoords = rawList.some((w) => w.visible !== false && Number.isFinite(w.colStart) && Number.isFinite(w.rowStart));
  if (hasExplicitCoords) {
    return resolveGridCollisions(
      rawList.map((w) => ({
        ...w,
        colStart: w.colStart || 1,
        rowStart: w.rowStart || 1
      })),
      null
    );
  }
  return autoPackWidgets(rawList);
}

function createSectionDefault(sectionId, overrides = {}, density = "normal") {
  const catalog = getWidgetCatalogBySection(sectionId);
  return {
    organization: "unified",
    density,
    widgets: buildSectionWidgetsFromCatalog(catalog, overrides)
  };
}

export function createDefaultLayout() {
  const sections = {
    dashboard: createSectionDefault("dashboard"),
    attack: createSectionDefault("attack"),
    defense: createSectionDefault("defense"),
    heatmaps: createSectionDefault("heatmaps"),
    goalkeeper: createSectionDefault("goalkeeper"),
    players: createSectionDefault("players"),
    chronology: createSectionDefault("chronology")
  };

  return {
    version: DASHBOARD_LAYOUT_VERSION,
    activePreset: "balanced",
    matchTabs: MATCH_TAB_CATALOG.map((tItem) => ({ id: tItem.id, visible: tItem.defaultVisible })),
    sections,
    // Compatibilidad v1
    matchDashboard: {
      ...sections.dashboard,
      tabs: MATCH_TAB_CATALOG.map((tItem) => ({ id: tItem.id, visible: tItem.defaultVisible }))
    },
    updatedAt: null
  };
}

export const DASHBOARD_PRESETS = [
  {
    id: "balanced",
    labelKey: "customize.preset_balanced",
    descKey: "customize.preset_balanced_desc",
    defaultLabel: "Equilibrado Completo",
    defaultDesc: "Todas las secciones estadísticas activas en su distribución estándar limpia de 12 columnas.",
    build: () => createDefaultLayout()
  },
  {
    id: "head_coach",
    labelKey: "customize.preset_head_coach",
    descKey: "customize.preset_head_coach_desc",
    defaultLabel: "Entrenador Principal",
    defaultDesc: "Prioriza alertas tácticas, Top Jugadores, momentum, evolución y líderes individuales de partido.",
    build: () => {
      const base = createDefaultLayout();
      base.activePreset = "head_coach";
      base.sections.dashboard = createSectionDefault("dashboard", {
        block_insights: { visible: true, colSpan: 12, rowSpan: 1 },
        kpi_off_eff: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_def_eff: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_xg: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_saves: { visible: true, colSpan: 3, rowSpan: 1 },
        chart_momentum: { visible: true, colSpan: 6, rowSpan: 2 },
        chart_evolution: { visible: true, colSpan: 6, rowSpan: 2 },
        block_top_players: { visible: true, colSpan: 12, rowSpan: 2 },
        chart_h2h: { visible: true, colSpan: 12, rowSpan: 2 },
        kpi_turnovers: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_possessions: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_discipline: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_cards: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_poss_time: { visible: false },
        kpi_free_throws: { visible: false },
        kpi_xsaves: { visible: false },
        kpi_steals: { visible: false },
        kpi_off_rebounds: { visible: false },
        kpi_def_rebounds: { visible: false }
      });
      base.sections.players = createSectionDefault("players", {
        pl_kpi_mvp: { visible: true, colSpan: 6, rowSpan: 1 },
        pl_kpi_top_scorer: { visible: true, colSpan: 6, rowSpan: 1 },
        pl_table_roster: { visible: true, colSpan: 12, rowSpan: 3 }
      });
      base.matchDashboard = { ...base.sections.dashboard, tabs: base.matchTabs };
      base.updatedAt = new Date().toISOString();
      return base;
    }
  },
  {
    id: "goalkeeper_coach",
    labelKey: "customize.preset_gk",
    descKey: "customize.preset_gk_desc",
    defaultLabel: "Especialista Portería",
    defaultDesc: "Destaca % Paradas, xSaves y Eficiencia Defensiva con tamaño ampliado y prioriza Portería.",
    build: () => {
      const base = createDefaultLayout();
      base.activePreset = "goalkeeper_coach";
      base.matchTabs = [
        { id: "dashboard", visible: true },
        { id: "goalkeeper", visible: true },
        { id: "defense", visible: true },
        { id: "heatmaps", visible: true },
        { id: "attack", visible: true },
        { id: "players", visible: true },
        { id: "chronology", visible: true }
      ];
      base.sections.dashboard = createSectionDefault("dashboard", {
        kpi_saves: { visible: true, colSpan: 6, rowSpan: 2 },
        kpi_xsaves: { visible: true, colSpan: 6, rowSpan: 2 },
        kpi_def_eff: { visible: true, colSpan: 4, rowSpan: 1 },
        kpi_def_rebounds: { visible: true, colSpan: 4, rowSpan: 1 },
        kpi_xg: { visible: true, colSpan: 4, rowSpan: 1 },
        kpi_off_eff: { visible: false },
        kpi_possessions: { visible: false },
        kpi_poss_time: { visible: false },
        kpi_free_throws: { visible: true, colSpan: 4, rowSpan: 1 },
        kpi_turnovers: { visible: true, colSpan: 4, rowSpan: 1 },
        kpi_steals: { visible: true, colSpan: 4, rowSpan: 1 },
        chart_h2h: { visible: true, colSpan: 12, rowSpan: 2 },
        chart_momentum: { visible: true, colSpan: 6, rowSpan: 2 },
        chart_evolution: { visible: true, colSpan: 6, rowSpan: 2 }
      });
      base.sections.defense = createSectionDefault("defense", {
        def_kpi_efficiency: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_rebounds: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_steals: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_free_throws: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_turnovers_forced: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_cards: { visible: true, colSpan: 4, rowSpan: 1 },
        def_kpi_two_min: { visible: false }
      });
      base.sections.goalkeeper = createSectionDefault("goalkeeper", {
        gk_goal_heatmap: { visible: true, colSpan: 7, rowSpan: 3 },
        gk_kpi_saves: { visible: true, colSpan: 5, rowSpan: 1 },
        gk_kpi_xsaves: { visible: true, colSpan: 5, rowSpan: 1 },
        gk_kpi_diff: { visible: true, colSpan: 5, rowSpan: 1 },
        gk_kpi_conceded: { visible: false },
        gk_table_performance: { visible: true, colSpan: 12, rowSpan: 2 }
      });
      base.matchDashboard = { ...base.sections.dashboard, tabs: base.matchTabs };
      base.updatedAt = new Date().toISOString();
      return base;
    }
  },
  {
    id: "minimalist",
    labelKey: "customize.preset_minimalist",
    descKey: "customize.preset_minimalist_desc",
    defaultLabel: "Vista Minimalista",
    defaultDesc: "Solo las 4 métricas clave, dos gráficos principales y secciones esenciales en formato compacto.",
    build: () => {
      const base = createDefaultLayout();
      base.activePreset = "minimalist";
      base.matchTabs = [
        { id: "dashboard", visible: true },
        { id: "players", visible: true },
        { id: "heatmaps", visible: true },
        { id: "attack", visible: false },
        { id: "defense", visible: false },
        { id: "goalkeeper", visible: false },
        { id: "chronology", visible: false }
      ];
      base.sections.dashboard = createSectionDefault("dashboard", {
        kpi_off_eff: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_xg: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_def_eff: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_saves: { visible: true, colSpan: 3, rowSpan: 1 },
        kpi_possessions: { visible: false },
        kpi_poss_time: { visible: false },
        kpi_free_throws: { visible: false },
        kpi_xsaves: { visible: false },
        kpi_turnovers: { visible: false },
        chart_momentum: { visible: true, colSpan: 6, rowSpan: 2 },
        chart_evolution: { visible: true, colSpan: 6, rowSpan: 2 },
        chart_h2h: { visible: false }
      }, "compact");
      base.matchDashboard = { ...base.sections.dashboard, tabs: base.matchTabs };
      base.updatedAt = new Date().toISOString();
      return base;
    }
  }
];

function sanitizeDensity(density, fallback = "normal") {
  return ["compact", "normal", "expanded"].includes(density) ? density : fallback;
}

function mergeSectionWidgets(savedSection, catalog) {
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));
  const savedWidgets = Array.isArray(savedSection?.widgets) ? savedSection.widgets : [];
  const hasAny2D = savedWidgets.some((w) => Number.isFinite(w?.colStart) && Number.isFinite(w?.rowStart));

  const seen = new Set();
  const collected = [];

  savedWidgets.forEach((w) => {
    if (!w || typeof w.id !== "string" || seen.has(w.id)) return;
    const meta = catalogMap.get(w.id);
    if (!meta) return;
    seen.add(w.id);
    const colSpan = clampInt(
      w.colSpan ?? legacySizeToSpan(w.size, meta.defaultColSpan),
      MIN_COL_SPAN,
      MAX_COL_SPAN,
      meta.defaultColSpan
    );
    const rowSpan = clampInt(
      w.rowSpan ?? (w.height === "tall" ? 2 : meta.defaultRowSpan),
      MIN_ROW_SPAN,
      MAX_ROW_SPAN,
      meta.defaultRowSpan
    );
    collected.push({
      id: w.id,
      visible: typeof w.visible === "boolean" ? w.visible : meta.defaultVisible,
      colSpan,
      rowSpan,
      colStart: Number.isFinite(Number(w.colStart)) ? clampInt(w.colStart, 1, GRID_COLUMNS - colSpan + 1, 1) : undefined,
      rowStart: Number.isFinite(Number(w.rowStart)) ? clampInt(w.rowStart, 1, 100, 1) : undefined
    });
  });

  catalog.forEach((meta) => {
    if (seen.has(meta.id)) return;
    collected.push({
      id: meta.id,
      visible: meta.defaultVisible,
      colSpan: meta.defaultColSpan,
      rowSpan: meta.defaultRowSpan
    });
  });

  let finalWidgets;
  if (hasAny2D) {
    // Asegurar que nuevos widgets del catálogo con defaultVisible=true que aún no tienen colStart reciban un hueco libre
    const withCoords = collected.filter((w) => Number.isFinite(w.colStart) && Number.isFinite(w.rowStart));
    const missingCoords = collected.filter((w) => !Number.isFinite(w.colStart) || !Number.isFinite(w.rowStart));
    const placedSoFar = withCoords.filter((w) => w.visible !== false);

    missingCoords.forEach((w) => {
      if (w.visible === false) {
        withCoords.push({ ...w, colStart: 1, rowStart: 1 });
      } else {
        const slot = findFirstFreeSlot(placedSoFar, w.colSpan, w.rowSpan);
        const placedItem = { ...w, colStart: slot.colStart, rowStart: slot.rowStart };
        placedSoFar.push(placedItem);
        withCoords.push(placedItem);
      }
    });
    finalWidgets = resolveGridCollisions(withCoords);

    const droppedObsolete = savedWidgets.some((w) => w && typeof w.id === "string" && !catalogMap.has(w.id));
    if (droppedObsolete) {
      const visibleMinRow = finalWidgets.reduce(
        (min, item) => (item.visible !== false && item.rowStart > 0 ? Math.min(min, item.rowStart) : min),
        Infinity
      );
      if (Number.isFinite(visibleMinRow) && visibleMinRow > 1) {
        const shift = visibleMinRow - 1;
        finalWidgets = finalWidgets.map((item) =>
          item.visible !== false ? { ...item, rowStart: Math.max(1, item.rowStart - shift) } : item
        );
      }
    }
  } else {
    finalWidgets = autoPackWidgets(collected);
  }

  return {
    organization: "unified",
    density: sanitizeDensity(savedSection?.density, "normal"),
    widgets: finalWidgets
  };
}

function mergeTabList(savedTabs) {
  const catalogMap = new Map(MATCH_TAB_CATALOG.map((t) => [t.id, t]));
  const result = [];
  const seen = new Set();

  if (Array.isArray(savedTabs)) {
    savedTabs.forEach((tItem) => {
      if (!tItem || typeof tItem.id !== "string" || seen.has(tItem.id)) return;
      const meta = catalogMap.get(tItem.id);
      if (!meta) return;
      seen.add(tItem.id);
      result.push({
        id: tItem.id,
        visible: typeof tItem.visible === "boolean" ? tItem.visible : meta.defaultVisible
      });
    });
  }

  MATCH_TAB_CATALOG.forEach((meta) => {
    if (!seen.has(meta.id)) {
      result.push({ id: meta.id, visible: meta.defaultVisible });
    }
  });

  if (!result.some((tItem) => tItem.visible) && result.length > 0) {
    result[0].visible = true;
  }

  return result;
}

/**
 * Normaliza y combina layouts v1 o v2 con el catálogo de las 7 secciones configurables.
 */
export function mergeWithDefaultLayout(rawLayout) {
  const base = createDefaultLayout();
  if (!rawLayout || typeof rawLayout !== "object") {
    return base;
  }

  const rawSections = rawLayout.sections || {};
  const legacyMatch = rawLayout.matchDashboard || {};

  const matchTabs = mergeTabList(rawLayout.matchTabs || legacyMatch.tabs);

  const sections = {};
  Object.keys(SECTION_CATALOGS).forEach((secId) => {
    const sourceSection = rawSections[secId] || (secId === "dashboard" ? legacyMatch : null);
    sections[secId] = mergeSectionWidgets(sourceSection, SECTION_CATALOGS[secId]);
  });

  return {
    version: DASHBOARD_LAYOUT_VERSION,
    activePreset: typeof rawLayout.activePreset === "string" ? rawLayout.activePreset : "custom",
    matchTabs,
    sections,
    matchDashboard: {
      ...sections.dashboard,
      tabs: matchTabs
    },
    updatedAt: rawLayout.updatedAt || null
  };
}

export function applyDashboardPreset(presetId) {
  const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId) || DASHBOARD_PRESETS[0];
  return mergeWithDefaultLayout(preset.build());
}

/**
 * Coloca o mueve un widget colocado dentro de la rejilla 2D a una coordenada (colStart, rowStart) libre de choques.
 */
export function moveWidgetToGridPos(section, widgetId, targetCoords = {}) {
  if (!section || !Array.isArray(section.widgets)) return section;
  const target = section.widgets.find((w) => w.id === widgetId);
  if (!target) return section;

  const colSpan = clampInt(targetCoords.colSpan ?? target.colSpan, MIN_COL_SPAN, MAX_COL_SPAN, target.colSpan || 4);
  const rowSpan = clampInt(targetCoords.rowSpan ?? target.rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, target.rowSpan || 1);
  const colStart = clampInt(targetCoords.colStart ?? target.colStart, 1, GRID_COLUMNS - colSpan + 1, 1);
  const rowStart = clampInt(targetCoords.rowStart ?? target.rowStart, 1, 100, 1);

  const updated = section.widgets.map((w) =>
    w.id === widgetId
      ? {
          ...w,
          visible: true,
          colStart,
          rowStart,
          colSpan,
          rowSpan,
          size: spanToLegacySize(colSpan),
          height: rowSpan >= 2 ? "tall" : "normal"
        }
      : w
  );

  return {
    ...section,
    widgets: resolveGridCollisions(updated, widgetId)
  };
}

/**
 * Añade una estadística desde la barra lateral al espacio blanco (en coordenadas concretas si se arrastra o primer hueco).
 */
export function addWidgetFromSidebar(section, widgetId, dropCoords = null) {
  if (!section || !Array.isArray(section.widgets)) return section;
  const target = section.widgets.find((w) => w.id === widgetId);
  if (!target) return section;

  const visibleWidgets = section.widgets.filter((w) => w.visible !== false && w.id !== widgetId);
  const colSpan = clampInt(target.colSpan, MIN_COL_SPAN, MAX_COL_SPAN, 4);
  const rowSpan = clampInt(target.rowSpan, MIN_ROW_SPAN, MAX_ROW_SPAN, 1);

  const coords = dropCoords && Number.isFinite(dropCoords.colStart) && Number.isFinite(dropCoords.rowStart)
    ? {
        colStart: clampInt(dropCoords.colStart, 1, GRID_COLUMNS - colSpan + 1, 1),
        rowStart: clampInt(dropCoords.rowStart, 1, 100, 1)
      }
    : findFirstFreeSlot(visibleWidgets, colSpan, rowSpan);

  return moveWidgetToGridPos(section, widgetId, {
    colStart: coords.colStart,
    rowStart: coords.rowStart,
    colSpan,
    rowSpan
  });
}

/**
 * Retira una estadística del espacio blanco devolviéndola a la barra lateral de no puestas.
 */
export function removeWidgetToSidebar(section, widgetId) {
  if (!section || !Array.isArray(section.widgets)) return section;
  return {
    ...section,
    widgets: section.widgets.map((w) => (w.id === widgetId ? { ...w, visible: false } : w))
  };
}

export function reorderListByIds(items = [], sourceId, targetId) {
  if (!Array.isArray(items) || !sourceId || !targetId || sourceId === targetId) {
    return items;
  }
  const fromIdx = items.findIndex((item) => item.id === sourceId);
  const toIdx = items.findIndex((item) => item.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return items;

  const next = [...items];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

export function moveItemByOffset(items = [], id, offset) {
  if (!Array.isArray(items) || !id || !offset) return items;
  const idx = items.findIndex((item) => item.id === id);
  const nextIdx = idx + offset;
  if (idx < 0 || nextIdx < 0 || nextIdx >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(idx, 1);
  next.splice(nextIdx, 0, moved);
  return next;
}

export function updateSectionWidget(section, widgetId, patch = {}) {
  if (!section || !Array.isArray(section.widgets)) return section;
  if (patch.visible === false) {
    return removeWidgetToSidebar(section, widgetId);
  }
  if (patch.visible === true) {
    return addWidgetFromSidebar(section, widgetId);
  }
  const existing = section.widgets.find((w) => w.id === widgetId);
  if (!existing) return section;

  const nextSpan = patch.colSpan ?? (patch.size ? legacySizeToSpan(patch.size, existing.colSpan) : existing.colSpan);
  const nextRowSpan = patch.rowSpan ?? (patch.height === "tall" ? Math.max(2, existing.rowSpan || 1) : patch.height === "compact" ? 1 : existing.rowSpan);

  return moveWidgetToGridPos(section, widgetId, {
    colStart: patch.colStart ?? existing.colStart,
    rowStart: patch.rowStart ?? existing.rowStart,
    colSpan: nextSpan,
    rowSpan: nextRowSpan
  });
}

export function resolveWidgetColSpan(sizeOrSpan, fallback = 4) {
  if (typeof sizeOrSpan === "number" && Number.isFinite(sizeOrSpan)) {
    return clampInt(sizeOrSpan, MIN_COL_SPAN, MAX_COL_SPAN, fallback);
  }
  return WIDGET_SIZE_SPANS[sizeOrSpan] || fallback;
}

export function resolveUserKey(userOrId) {
  if (!userOrId) return "guest";
  if (typeof userOrId === "string") return userOrId;
  if (userOrId.role === "guest") return "guest";
  return userOrId._id || userOrId.firebase_uid || userOrId.uid || "guest";
}

export function getDashboardStorageKey(userOrId) {
  return `handtix_dashboard_layout_${resolveUserKey(userOrId)}`;
}

export function resolvePreferredLayout(userOrId, localUserLayoutRaw = null, fallbackDefaultRaw = null) {
  const cloudLayout =
    userOrId && typeof userOrId === "object" && userOrId.dashboard_preferences
      ? mergeWithDefaultLayout(userOrId.dashboard_preferences)
      : null;

  let localUserLayout = null;
  if (localUserLayoutRaw) {
    try {
      const parsed = typeof localUserLayoutRaw === "string" ? JSON.parse(localUserLayoutRaw) : localUserLayoutRaw;
      localUserLayout = mergeWithDefaultLayout(parsed);
    } catch {
      localUserLayout = null;
    }
  }

  if (localUserLayout && cloudLayout) {
    const localTime = localUserLayout.updatedAt ? new Date(localUserLayout.updatedAt).getTime() : 0;
    const cloudTime = cloudLayout.updatedAt ? new Date(cloudLayout.updatedAt).getTime() : 0;
    return cloudTime >= localTime ? cloudLayout : localUserLayout;
  }

  if (cloudLayout) return cloudLayout;
  if (localUserLayout) return localUserLayout;

  if (fallbackDefaultRaw) {
    try {
      const parsed = typeof fallbackDefaultRaw === "string" ? JSON.parse(fallbackDefaultRaw) : fallbackDefaultRaw;
      return mergeWithDefaultLayout(parsed);
    } catch {
      return createDefaultLayout();
    }
  }

  return createDefaultLayout();
}

export function loadDashboardLayoutLocal(userOrId) {
  try {
    if (typeof localStorage === "undefined") {
      return resolvePreferredLayout(userOrId, null, null);
    }
    const userKey = getDashboardStorageKey(userOrId);
    const localUserRaw = localStorage.getItem(userKey);
    const fallbackDefaultRaw =
      resolveUserKey(userOrId) === "guest" ? localStorage.getItem("handtix_dashboard_layout_default") : null;
    return resolvePreferredLayout(userOrId, localUserRaw, fallbackDefaultRaw);
  } catch (err) {
    console.error("Error leyendo personalización local del dashboard:", err);
    return createDefaultLayout();
  }
}

export function saveDashboardLayoutLocal(layout, userOrId) {
  const normalized = mergeWithDefaultLayout({
    ...layout,
    updatedAt: layout?.updatedAt || new Date().toISOString()
  });

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(getDashboardStorageKey(userOrId), JSON.stringify(normalized));
      localStorage.setItem("handtix_dashboard_layout_default", JSON.stringify(normalized));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DASHBOARD_LAYOUT_EVENT, { detail: normalized }));
    }
  } catch (err) {
    console.error("Error guardando personalización local del dashboard:", err);
  }

  return normalized;
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DASHBOARD_PRESETS,
  MATCH_TAB_CATALOG,
  SECTION_CATALOGS,
  SECTION_INDEX,
  addWidgetFromSidebar,
  applyDashboardPreset,
  createDefaultLayout,
  getDashboardStorageKey,
  mergeWithDefaultLayout,
  moveItemByOffset,
  moveWidgetToGridPos,
  rectsOverlap,
  removeWidgetToSidebar,
  reorderListByIds,
  resolvePreferredLayout,
  resolveWidgetColSpan,
  updateSectionWidget
} from "./dashboardLayoutService.js";

function assertNoOverlaps(widgets, contextLabel) {
  const visible = widgets.filter((w) => w.visible !== false);
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      assert.equal(
        rectsOverlap(visible[i], visible[j]),
        false,
        `${contextLabel}: ${visible[i].id} y ${visible[j].id} no deben solaparse`
      );
    }
  }
}

describe("dashboardLayoutService v2 - Estudio Libre 2D y Secciones Completas", () => {
  it("createDefaultLayout inicializa el índice completo de 7 secciones desde Dashboard hasta Cronología (sin Informe ni Equipo)", () => {
    const layout = createDefaultLayout();

    assert.equal(layout.version, 2);
    assert.equal(layout.activePreset, "balanced");
    assert.equal(SECTION_INDEX.length, 7);
    assert.deepEqual(
      SECTION_INDEX.map((s) => s.id),
      ["dashboard", "attack", "defense", "heatmaps", "goalkeeper", "players", "chronology"]
    );
    assert.equal(SECTION_CATALOGS.report, undefined);
    assert.equal(SECTION_CATALOGS.team, undefined);

    Object.keys(SECTION_CATALOGS).forEach((secId) => {
      const section = layout.sections[secId];
      assert.ok(section, `Debe existir layout.sections.${secId}`);
      assert.equal(section.widgets.length, SECTION_CATALOGS[secId].length);
      assertNoOverlaps(section.widgets, secId);
    });

    const dashIds = SECTION_CATALOGS.dashboard.map((w) => w.id);
    assert.equal(dashIds.includes("kpi_goals"), false);
    assert.equal(dashIds.includes("block_attack_phases"), false);
    assert.ok(dashIds.includes("kpi_off_rebounds"));
    assert.ok(dashIds.includes("kpi_def_rebounds"));
    assert.ok(dashIds.includes("kpi_steals"));
    assert.ok(dashIds.includes("kpi_discipline"));
    assert.ok(dashIds.includes("kpi_cards"));

    const defIds = SECTION_CATALOGS.defense.map((w) => w.id);
    assert.equal(defIds.includes("def_kpi_goals_conceded"), false);
    assert.ok(defIds.includes("def_kpi_steals"));
    assert.ok(defIds.includes("def_kpi_cards"));

    assert.deepEqual(SECTION_CATALOGS.heatmaps.map((w) => w.id), ["hm_combined_court"]);
    assert.equal(SECTION_CATALOGS.players.some((w) => w.id === "pl_kpi_discipline"), false);
    assert.equal(SECTION_CATALOGS.chronology.some((w) => w.id === "chr_filter_bar"), false);
    assert.equal(SECTION_CATALOGS.goalkeeper.some((w) => w.id === "gk_selector_bar"), false);
    assert.ok(SECTION_CATALOGS.chronology.some((w) => w.id === "chr_timeline"));
  });

  it("addWidgetFromSidebar, moveWidgetToGridPos y removeWidgetToSidebar permiten colocación libre 2D y tamaño por bordes sin solapamientos", () => {
    const base = createDefaultLayout();
    let attackSec = base.sections.attack;

    // 1. Añadir atk_kpi_rebounds desde barra lateral exactamente a (colStart: 5, rowStart: 4) con colSpan: 4
    attackSec = addWidgetFromSidebar(attackSec, "atk_kpi_rebounds", { colStart: 5, rowStart: 4 });
    const placed = attackSec.widgets.find((w) => w.id === "atk_kpi_rebounds");
    assert.equal(placed.visible, true);
    assert.equal(placed.colStart, 5);
    assert.equal(placed.rowStart, 4);
    assertNoOverlaps(attackSec.widgets, "attack after sidebar drop");

    // 2. Redimensionar borde ancho a 8 columnas y alto a 2 filas
    attackSec = moveWidgetToGridPos(attackSec, "atk_kpi_shots", { colSpan: 8, rowSpan: 2 });
    const resized = attackSec.widgets.find((w) => w.id === "atk_kpi_shots");
    assert.equal(resized.colSpan, 8);
    assert.equal(resized.rowSpan, 2);
    assert.equal(resized.colStart, 1);
    assertNoOverlaps(attackSec.widgets, "attack after border resize");

    // 3. Retirar widget al panel lateral
    attackSec = removeWidgetToSidebar(attackSec, "atk_kpi_rebounds");
    const removed = attackSec.widgets.find((w) => w.id === "atk_kpi_rebounds");
    assert.equal(removed.visible, false);
  });

  it("mergeWithDefaultLayout migra layouts v1 (matchDashboard) a v2 sin perder configuración ni solapar", () => {
    const legacyV1 = {
      version: 1,
      activePreset: "custom",
      matchDashboard: {
        density: "compact",
        tabs: [
          { id: "players", visible: true },
          { id: "dashboard", visible: false },
          { id: "report", visible: true }
        ],
        widgets: [
          { id: "chart_momentum", visible: true, size: "full", height: "tall" },
          { id: "kpi_xg", visible: true, size: "md", height: "compact" },
          { id: "widget_inexistente_eliminado", visible: true, size: "sm" }
        ]
      },
      teamDashboard: {
        density: "expanded",
        widgets: [{ id: "team_kpi_saves", visible: true, size: "lg", height: "tall" }]
      }
    };

    const merged = mergeWithDefaultLayout(legacyV1);
    assert.equal(merged.version, 2);
    assert.equal(merged.matchTabs[0].id, "players");
    assert.equal(merged.matchTabs.length, MATCH_TAB_CATALOG.length);
    assert.equal(merged.matchTabs.some((t) => t.id === "report"), false);
    assert.equal(merged.sections.report, undefined);
    assert.equal(merged.sections.team, undefined);

    const dashSec = merged.sections.dashboard;
    assert.equal(dashSec.density, "compact");
    const mom = dashSec.widgets.find((w) => w.id === "chart_momentum");
    assert.equal(mom.colSpan, 12);
    assert.equal(mom.rowSpan, 2);
    assertNoOverlaps(dashSec.widgets, "migrated dashboard");
  });

  it("mergeWithDefaultLayout garantiza que siempre quede al menos 1 pestaña visible", () => {
    const allHidden = {
      matchTabs: MATCH_TAB_CATALOG.map((t) => ({ id: t.id, visible: false }))
    };
    const merged = mergeWithDefaultLayout(allHidden);
    assert.ok(merged.matchTabs.some((t) => t.visible));
  });

  it("reorderListByIds y moveItemByOffset reordenan pestañas inmutablemente", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const dragged = reorderListByIds(items, "d", "b");
    assert.deepEqual(dragged.map((x) => x.id), ["a", "d", "b", "c"]);

    const movedUp = moveItemByOffset(dragged, "b", -1);
    assert.deepEqual(movedUp.map((x) => x.id), ["a", "b", "d", "c"]);
    assert.equal(moveItemByOffset(movedUp, "a", -1), movedUp);
  });

  it("updateSectionWidget y resolveWidgetColSpan validan tamaños y visibilidad", () => {
    const def = createDefaultLayout().sections.dashboard;
    const updated = updateSectionWidget(def, "kpi_saves", {
      size: "lg",
      height: "tall"
    });
    const gkCard = updated.widgets.find((w) => w.id === "kpi_saves");
    assert.equal(gkCard.colSpan, 8);
    assert.equal(gkCard.rowSpan, 2);
    assert.equal(resolveWidgetColSpan(gkCard.colSpan), 8);
    assertNoOverlaps(updated.widgets, "updated dashboard widget");
  });

  it("applyDashboardPreset aplica los 4 modelos predeterminados configurando múltiples secciones sin colisiones", () => {
    assert.equal(DASHBOARD_PRESETS.length, 4);

    DASHBOARD_PRESETS.forEach((p) => {
      const applied = applyDashboardPreset(p.id);
      assert.equal(applied.activePreset, p.id);
      Object.keys(SECTION_CATALOGS).forEach((secId) => {
        assertNoOverlaps(applied.sections[secId].widgets, `${p.id}.${secId}`);
      });
    });

    const gkPreset = applyDashboardPreset("goalkeeper_coach");
    assert.equal(gkPreset.matchTabs[1].id, "goalkeeper");
    assert.equal(gkPreset.sections.goalkeeper.widgets[0].id, "gk_goal_heatmap");

    const minimalPreset = applyDashboardPreset("minimalist");
    assert.equal(minimalPreset.matchTabs.filter((t) => t.visible).length, 3);
    assert.equal(minimalPreset.sections.dashboard.density, "compact");
  });

  it("resolvePreferredLayout prioriza la versión más reciente entre nube (Mongo) y caché local por usuario", () => {
    const olderLocal = {
      activePreset: "minimalist",
      updatedAt: "2026-11-10T10:00:00.000Z"
    };
    const newerCloudUser = {
      _id: "65f123abc4567890",
      dashboard_preferences: {
        activePreset: "head_coach",
        updatedAt: "2026-11-11T12:00:00.000Z"
      }
    };

    const resolvedCloudWins = resolvePreferredLayout(newerCloudUser, olderLocal);
    assert.equal(resolvedCloudWins.activePreset, "head_coach");

    const newerLocal = {
      activePreset: "goalkeeper_coach",
      updatedAt: "2026-11-12T08:00:00.000Z"
    };
    const resolvedLocalWins = resolvePreferredLayout(newerCloudUser, newerLocal);
    assert.equal(resolvedLocalWins.activePreset, "goalkeeper_coach");

    assert.equal(
      getDashboardStorageKey({ role: "guest", _id: "123" }),
      "handtix_dashboard_layout_guest"
    );
  });

  it("Todos los 6 diccionarios i18n traducen sidebar.customize_dashboard, el índice y TODOS los widgets de las 7 secciones", () => {
    const langs = ["es", "en", "de", "fr", "da", "pl"];
    const allCatalogItems = Object.values(SECTION_CATALOGS).flat();

    for (const lang of langs) {
      const filePath = path.resolve(process.cwd(), `src/i18n/locales/${lang}.json`);
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      assert.ok(parsed.sidebar?.customize_dashboard, `${lang}.json debe definir sidebar.customize_dashboard`);
      assert.ok(parsed.customize?.index_title, `${lang}.json debe definir customize.index_title`);
      assert.ok(parsed.customize?.sidebar_unplaced_title, `${lang}.json debe definir customize.sidebar_unplaced_title`);
      assert.ok(parsed.customize?.widgets, `${lang}.json debe definir customize.widgets`);

      for (const item of allCatalogItems) {
        assert.ok(
          parsed.customize.widgets[item.id],
          `${lang}.json -> customize.widgets.${item.id} debe existir`
        );
      }
    }
  });
});

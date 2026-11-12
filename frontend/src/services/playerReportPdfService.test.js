import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  computePlayerReportSummary,
  generatePlayerReportPdf,
  downloadPlayerReportPdf,
  sanitizeReportFilename,
  formatSecondsToClock,
  formatShortDate,
  REPORT_TEXTS
} from "./playerReportPdfService.js";

function buildFieldPlayerFixture() {
  return {
    number: 9,
    name: "Alejandro García",
    is_goalkeeper: false,
    shotPhases: { posicional: 12, oleada1: 4, oleada2: 2, penalti: 2 },
    shotZones: { backcourt: 10, wing: 2, pivot: 3, sevenM: 2, fastbreak: 3, other: 0 },
    matches: [
      {
        matchId: "m3",
        date: "2026-03-22",
        opponent: "CB Ciudad Encantada",
        isHome: true,
        teamGoals: 30,
        oppGoals: 27,
        score: "30 - 27",
        result: "W",
        played: true,
        secondsPlayed: 2400,
        goals: 7,
        shotsCount: 10,
        efficiency: 70,
        xg: 5.2,
        turnovers: 2,
        steals: 1,
        drawn7mCount: 2,
        penaltiesCommitted: 0,
        offFoulsDrawn: 1,
        offensiveFouls: 1,
        twoMins: 1,
        yellowCards: 1,
        redCards: 0,
        blueCards: 0,
        rating: 8.4
      },
      {
        matchId: "m1",
        date: "2026-03-08",
        opponent: "Fraikin BM Granollers",
        isHome: false,
        teamGoals: 26,
        oppGoals: 26,
        score: "26 - 26",
        result: "D",
        played: true,
        secondsPlayed: 1800,
        goals: 5,
        shotsCount: 8,
        efficiency: 63,
        xg: 4.0,
        turnovers: 1,
        steals: 2,
        drawn7mCount: 1,
        penaltiesCommitted: 1,
        offFoulsDrawn: 0,
        offensiveFouls: 0,
        twoMins: 0,
        yellowCards: 0,
        redCards: 0,
        blueCards: 0,
        rating: 7.4
      },
      {
        matchId: "m2",
        date: "2026-03-15",
        opponent: "Bidasoa Irún",
        isHome: true,
        teamGoals: 24,
        oppGoals: 28,
        score: "24 - 28",
        result: "L",
        played: false,
        secondsPlayed: 0,
        goals: 0,
        shotsCount: 0,
        efficiency: 0,
        xg: 0,
        turnovers: 0,
        steals: 0,
        drawn7mCount: 0,
        penaltiesCommitted: 0,
        offFoulsDrawn: 0,
        offensiveFouls: 0,
        twoMins: 0,
        yellowCards: 0,
        redCards: 0,
        blueCards: 0,
        rating: 7.0
      }
    ]
  };
}

function buildGoalkeeperFixture() {
  return {
    number: 1,
    name: "Gonzalo Pérez",
    is_goalkeeper: true,
    matches: [
      {
        matchId: "gk1",
        date: "2026-02-01",
        opponent: "BM Logroño",
        isHome: true,
        score: "31 - 25",
        result: "W",
        played: true,
        secondsPlayed: 3000,
        saves: 14,
        shotsFaced: 35,
        savePct: 40,
        goalkeeperXSaves: 10.5,
        goals: 0,
        shotsCount: 0,
        xg: 0,
        turnovers: 1,
        steals: 0,
        drawn7mCount: 0,
        penaltiesCommitted: 0,
        offFoulsDrawn: 0,
        offensiveFouls: 0,
        twoMins: 0,
        rating: 8.6
      },
      {
        matchId: "gk2",
        date: "2026-02-08",
        opponent: "Abanca Ademar",
        isHome: false,
        score: "27 - 29",
        result: "L",
        played: true,
        secondsPlayed: 2400,
        saves: 10,
        shotsFaced: 33,
        savePct: 30,
        goalkeeperXSaves: 9.5,
        goals: 1,
        shotsCount: 1,
        xg: 0.75,
        turnovers: 0,
        steals: 1,
        drawn7mCount: 0,
        penaltiesCommitted: 0,
        offFoulsDrawn: 0,
        offensiveFouls: 0,
        twoMins: 0,
        rating: 7.2
      }
    ]
  };
}

describe("playerReportPdfService - Informe Individual de Jugador", () => {
  it("Debe calcular totales, balance W-D-L, orden cronológico y promedios correctamente para un jugador de campo", () => {
    const player = buildFieldPlayerFixture();
    const summary = computePlayerReportSummary(player);

    assert.equal(summary.isGoalkeeper, false);
    assert.equal(summary.matchesPlayed, 2); // Solo 2 jugados de 3 en convocatoria
    assert.equal(summary.totalSquadMatches, 3);
    assert.equal(summary.wins, 1);
    assert.equal(summary.draws, 1);
    assert.equal(summary.losses, 1);

    // Orden cronológico (m1 08/03 -> m2 15/03 -> m3 22/03)
    assert.deepEqual(
      summary.matches.map((m) => m.matchId),
      ["m1", "m2", "m3"]
    );

    // Totales
    assert.equal(summary.totals.goals, 12);
    assert.equal(summary.totals.shotsCount, 18);
    assert.equal(summary.totals.efficiency, 67);
    assert.equal(summary.totals.xg, 9.2);
    assert.equal(summary.totals.turnovers, 3);
    assert.equal(summary.totals.steals, 3);
    assert.equal(summary.totals.drawn7mCount, 3);
    assert.equal(summary.totals.penaltiesCommitted, 1);
    assert.equal(summary.totals.minutesFormatted, "70:00");

    // Promedios sobre 2 partidos jugados
    assert.equal(summary.averages.goals, "6.0");
    assert.equal(summary.averages.shotsCount, "9.0");
    assert.equal(summary.averages.xg, "4.60");
    assert.equal(summary.averages.turnovers, "1.5");
    assert.equal(summary.averages.minutesFormatted, "35:00");
    assert.equal(summary.averages.rating, "7.9");
    assert.equal(summary.averages.bestRating, "8.4");
    assert.equal(summary.averages.worstRating, "7.4");
  });

  it("Debe calcular totales y promedios específicos de portero (saves, shotsFaced, xSaves)", () => {
    const gk = buildGoalkeeperFixture();
    const summary = computePlayerReportSummary(gk);

    assert.equal(summary.isGoalkeeper, true);
    assert.equal(summary.matchesPlayed, 2);
    assert.equal(summary.totals.saves, 24);
    assert.equal(summary.totals.shotsFaced, 68);
    assert.equal(summary.totals.savePct, 35);
    assert.equal(summary.totals.goalkeeperXSaves, 20);
    assert.equal(summary.totals.savesMinusXSaves, 4);

    assert.equal(summary.averages.saves, "12.0");
    assert.equal(summary.averages.shotsFaced, "34.0");
    assert.equal(summary.averages.goalkeeperXSaves, "10.0");
    assert.equal(summary.averages.rating, "7.9");
  });

  it("Debe manejar jugadores sin partidos sin NaN ni errores de división", () => {
    const summary = computePlayerReportSummary({
      number: 17,
      name: "Jugador Sin Partidos",
      is_goalkeeper: false,
      matches: []
    });

    assert.equal(summary.matchesPlayed, 0);
    assert.equal(summary.totals.goals, 0);
    assert.equal(summary.averages.goals, "0.0");
    assert.equal(summary.averages.xg, "0.00");
    assert.equal(summary.averages.minutesFormatted, "00:00");
    assert.equal(summary.averages.rating, "-");

    const pdf = generatePlayerReportPdf({ number: 17, name: "Jugador Sin Partidos", matches: [] }, { name: "Club Test" }, "es");
    assert.equal(pdf.internal.getNumberOfPages(), 1);
  });

  it("Debe paginar limpiamente un informe con 24 partidos en múltiples páginas", () => {
    const base = buildFieldPlayerFixture();
    const manyMatches = [];
    for (let i = 1; i <= 24; i++) {
      manyMatches.push({
        ...base.matches[i % 2],
        matchId: `m-${i}`,
        date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
        opponent: `Rival Liga Jornada ${i}`
      });
    }

    const pdf = generatePlayerReportPdf(
      { ...base, matches: manyMatches, secondsPlayed: 24 * 1800 },
      { name: "Balonmano Handtix" },
      "es"
    );

    const pageCount = pdf.internal.getNumberOfPages();
    const byteLength = pdf.output("arraybuffer").byteLength;
    assert.ok(pageCount >= 2, `Se esperaban múltiples páginas para 24 partidos (obtenidas: ${pageCount})`);
    assert.ok(byteLength > 2500, `El PDF generado debe tener contenido válido (bytes: ${byteLength})`);
  });

  it("Debe generar PDF correctamente para portero y para los 6 idiomas soportados sin referencias a HandStats", () => {
    const gk = buildGoalkeeperFixture();
    const langs = ["es", "en", "de", "fr", "da", "pl", "es-ES"];

    for (const lang of langs) {
      const pdf = generatePlayerReportPdf(gk, { name: "Handtix Club" }, lang);
      assert.ok(pdf.internal.getNumberOfPages() >= 1, `Debe generar páginas para idioma ${lang}`);
      assert.ok(pdf.output("arraybuffer").byteLength > 1500);
    }

    // Verificar ausencia de antigua marca en plantillas de texto del informe
    const allTexts = JSON.stringify(REPORT_TEXTS).toLowerCase();
    assert.equal(allTexts.includes("handstats"), false, "REPORT_TEXTS no debe mencionar HandStats");
  });

  it("Debe formatear fechas, reloj y nombres de archivo de descarga limpiamente", () => {
    assert.equal(formatSecondsToClock(125), "02:05");
    assert.equal(formatSecondsToClock(-10), "00:00");
    assert.equal(formatShortDate("2026-03-22"), "22/03/26");
    assert.equal(formatShortDate(null), "-");
    assert.equal(
      sanitizeReportFilename("Alejandro García", 9),
      "Handtix_Informe_9-Alejandro-Garcia.pdf"
    );
    assert.throws(() => downloadPlayerReportPdf(null), /Player data is required/);
  });

  it("Debe contar con claves traducidas de informe individual en los 6 archivos locales i18n", () => {
    const langs = ["es", "en", "de", "fr", "da", "pl"];
    const requiredKeys = [
      "download_report",
      "downloading_report",
      "report_download_success",
      "report_download_error"
    ];

    for (const lang of langs) {
      const filePath = path.resolve(process.cwd(), `src/i18n/locales/${lang}.json`);
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      assert.ok(parsed.player_card, `${lang}.json debe incluir player_card`);
      for (const key of requiredKeys) {
        assert.equal(
          typeof parsed.player_card[key],
          "string",
          `${lang}.json -> player_card.${key} debe existir como string`
        );
        assert.ok(parsed.player_card[key].length > 0);
      }
    }
  });
});


/**
 * playerReportPdfService.js
 * Generador y exportador de Informes Individuales de Rendimiento en PDF (Handtix Pro).
 *
 * Genera un dossier vectorial A4 por jugador con:
 * - Ficha de identidad, rol (Portero / Jugador de Campo), equipo y balance W-D-L
 * - Resumen de totales de temporada y promedios por partido
 * - Desglose táctico de fases y zonas de lanzamiento (cuando aplica)
 * - Tabla completa paginada con todos los partidos disputados, fila de totales y fila de promedios
 * - Soporte multilingüe (ES, EN, DE, FR, DA, PL)
 */

import { jsPDF } from "jspdf";

// Paleta oficial de marca Handtix adaptada para impresión sobre fondo blanco
export const PLAYER_PDF_COLORS = {
  primary: [46, 125, 79],       // #2E7D4F (Verde Handtix Principal)
  primarySoft: [232, 245, 237], // #E8F5ED
  secondary: [245, 158, 11],    // #F59E0B (Ámbar)
  secondarySoft: [254, 243, 199],
  tactical: [2, 132, 199],      // #0284C7 (Azul Táctico)
  tacticalSoft: [224, 242, 254],
  danger: [239, 68, 68],        // #EF4444 (Rojo)
  dangerSoft: [254, 226, 226],
  dark: [20, 24, 27],           // #14181B
  text: [30, 41, 59],           // #1E293B
  textMuted: [100, 116, 139],   // #64748B
  border: [226, 232, 240],      // #E2E8F0
  bgLight: [248, 250, 252],     // #F8FAFC
  bgAlt: [241, 245, 249],       // #F1F5F9
  white: [255, 255, 255]        // #FFFFFF
};

const PAGE_WIDTH = 210;
const MARGIN_X = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 182 mm
const MAX_CONTENT_Y = 274;

const POLISH_CHAR_MAP = {
  "\u0104": "A", "\u0105": "a",
  "\u0106": "C", "\u0107": "c",
  "\u0118": "E", "\u0119": "e",
  "\u0141": "L", "\u0142": "l",
  "\u0143": "N", "\u0144": "n",
  "\u00D3": "O", "\u00F3": "o",
  "\u015A": "S", "\u015B": "s",
  "\u0179": "Z", "\u017A": "z",
  "\u017B": "Z", "\u017C": "z",
  "\u2014": "-", "\u2013": "-", "\u2212": "-"
};

export const REPORT_TEXTS = {
  es: {
    headerTag: "INFORME INDIVIDUAL DE JUGADOR",
    roleGk: "PORTERO",
    roleField: "JUGADOR DE CAMPO",
    squadRecord: "{{played}} jugados / {{total}} convocatoria",
    balance: "Balance: {{w}}V - {{d}}E - {{l}}D",
    generated: "Generado: {{date}}",
    avgRatingLabel: "RATING MEDIO",
    bestWorstRating: "Mejor: {{best}}  |  Peor: {{worst}}",
    sectionSummary: "1. RESUMEN ACUMULADO Y PROMEDIOS POR PARTIDO",
    sectionTactics: "2. DISTRIBUCIÓN TÁCTICA DE LANZAMIENTOS",
    sectionMatches: "3. DETALLE COMPLETO DE PARTIDOS ({{count}})",
    sectionMatchesNoNum: "2. DETALLE COMPLETO DE PARTIDOS ({{count}})",
    cardSaves: "Paradas / Tiros Rec.",
    cardXSaves: "xSaves (Esperadas)",
    cardGoals: "Goles / Tiros Campo",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Tiempo en Pista",
    cardDiscipline: "Pérdidas y Sanciones",
    avgPrefix: "Prom",
    savesPerMatchShort: "par/p",
    shotsFacedShort: "rec/p",
    goalsPerMatchShort: "g/p",
    shotsPerMatchShort: "tir/p",
    perMatchUnit: "/p",
    diffLabel: "Dif",
    stealsLabel: "Recup",
    exclShort: "excl",
    colMetric: "Indicador / Métrica",
    colTotal: "Total Acumulado",
    colAverage: "Promedio / Partido",
    colRatio: "Referencia / Ratio",
    rowMatches: "Partidos Disputados",
    rowMinutes: "Minutos en Pista",
    rowRating: "Valoración Handtix (0-10)",
    rowSaves: "Paradas en Portería",
    rowShotsFaced: "Tiros Recibidos / xSaves",
    rowGoals: "Goles Anotados",
    rowShots: "Lanzamientos Totales",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Pérdidas de Balón",
    rowSteals: "Recuperaciones",
    row7m: "7 Metros (Prov. / Com.)",
    rowOffFouls: "Faltas Ataque (Prov. / Com.)",
    rowSanctions: "Sanciones (2' / A / R / Az)",
    participationRate: "{{pct}}% de los partidos",
    efficiencySuffix: "eficacia {{pct}}%",
    savePctSuffix: "eficacia {{pct}}%",
    provComHint: "Provocados / Cometidos",
    phasesTitle: "Fases de Lanzamiento",
    zonesTitle: "Zonas de Lanzamiento",
    phasePos: "Posicional",
    phase1st: "Contraataque / 1a Ol.",
    phase2nd: "2a Oleada",
    phase7m: "Penalti (7m)",
    zoneBackcourt: "Primera Línea (9m)",
    zoneWing: "Extremo",
    zonePivot: "Pivote",
    zone7m: "7 Metros",
    zoneFastbreak: "Contraataque",
    zoneOther: "Otras Zonas",
    tblDate: "Fecha",
    tblOpponent: "Rival (L/V)",
    tblScore: "Marcador",
    tblMin: "Min",
    tblSavesFaced: "Par/Rec",
    tblSavePct: "%Par",
    tblXSaves: "xSv",
    tblGoalsShots: "G/T",
    tblEff: "%Ef",
    tblXg: "xG",
    tblTurnovers: "Pér",
    tbl7m: "7m P/C",
    tbl2Min: "2'",
    tblRating: "Rat",
    totalRowLabel: "TOTALES ({{count}} partidos)",
    avgRowLabel: "PROMEDIO / PARTIDO ({{count}} jug.)",
    noMatchesText: "Este jugador todavía no tiene partidos registrados en el equipo.",
    homeTag: "(L)",
    awayTag: "(V)",
    winChar: "V",
    drawChar: "E",
    lossChar: "D",
    dnpLabel: "DNP",
    footerLeft: "Handtix Pro  |  Informe Individual de Rendimiento",
    pageOf: "Página {{current}} de {{total}}",
    runningHeader: "HANDTIX PRO  |  Informe Individual: #{{number}} {{name}} ({{team}})"
  },
  en: {
    headerTag: "INDIVIDUAL PLAYER REPORT",
    roleGk: "GOALKEEPER",
    roleField: "FIELD PLAYER",
    squadRecord: "{{played}} played / {{total}} squad",
    balance: "Record: {{w}}W - {{d}}D - {{l}}L",
    generated: "Generated: {{date}}",
    avgRatingLabel: "AVG RATING",
    bestWorstRating: "Best: {{best}}  |  Worst: {{worst}}",
    sectionSummary: "1. SEASON TOTALS & PER-MATCH AVERAGES",
    sectionTactics: "2. TACTICAL SHOT DISTRIBUTION",
    sectionMatches: "3. FULL MATCH-BY-MATCH LOG ({{count}})",
    sectionMatchesNoNum: "2. FULL MATCH-BY-MATCH LOG ({{count}})",
    cardSaves: "Saves / Shots Faced",
    cardXSaves: "xSaves (Expected)",
    cardGoals: "Goals / Field Shots",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Time on Court",
    cardDiscipline: "Turnovers & Discipline",
    avgPrefix: "Avg",
    savesPerMatchShort: "sv/m",
    shotsFacedShort: "sf/m",
    goalsPerMatchShort: "g/m",
    shotsPerMatchShort: "sh/m",
    perMatchUnit: "/m",
    diffLabel: "Diff",
    stealsLabel: "Stl",
    exclShort: "2'",
    colMetric: "Indicator / Metric",
    colTotal: "Season Total",
    colAverage: "Match Average",
    colRatio: "Reference / Ratio",
    rowMatches: "Matches Played",
    rowMinutes: "Minutes Played",
    rowRating: "Handtix Rating (0-10)",
    rowSaves: "Goalkeeper Saves",
    rowShotsFaced: "Shots Faced / xSaves",
    rowGoals: "Goals Scored",
    rowShots: "Total Shots",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Turnovers",
    rowSteals: "Steals / Recoveries",
    row7m: "7-Meter (Drawn / Comm.)",
    rowOffFouls: "Off. Fouls (Drawn / Comm.)",
    rowSanctions: "Sanctions (2' / Y / R / B)",
    participationRate: "{{pct}}% appearance rate",
    efficiencySuffix: "{{pct}}% efficiency",
    savePctSuffix: "{{pct}}% save pct",
    provComHint: "Drawn / Committed",
    phasesTitle: "Attack Phases",
    zonesTitle: "Shot Zones",
    phasePos: "Positional",
    phase1st: "Fastbreak / 1st Wave",
    phase2nd: "2nd Wave",
    phase7m: "Penalty (7m)",
    zoneBackcourt: "Backcourt (9m)",
    zoneWing: "Wing",
    zonePivot: "Pivot",
    zone7m: "7-Meter",
    zoneFastbreak: "Fastbreak",
    zoneOther: "Other Zones",
    tblDate: "Date",
    tblOpponent: "Opponent (H/A)",
    tblScore: "Score",
    tblMin: "Min",
    tblSavesFaced: "Sv/SF",
    tblSavePct: "Sv%",
    tblXSaves: "xSv",
    tblGoalsShots: "G/S",
    tblEff: "Eff%",
    tblXg: "xG",
    tblTurnovers: "TO",
    tbl7m: "7m D/C",
    tbl2Min: "2'",
    tblRating: "Rat",
    totalRowLabel: "TOTALS ({{count}} matches)",
    avgRowLabel: "MATCH AVERAGE ({{count}} played)",
    noMatchesText: "This player has no matches recorded yet in the team.",
    homeTag: "(H)",
    awayTag: "(A)",
    winChar: "W",
    drawChar: "D",
    lossChar: "L",
    dnpLabel: "DNP",
    footerLeft: "Handtix Pro  |  Individual Performance Report",
    pageOf: "Page {{current}} of {{total}}",
    runningHeader: "HANDTIX PRO  |  Player Report: #{{number}} {{name}} ({{team}})"
  },
  de: {
    headerTag: "EINZELSPIELERBERICHT",
    roleGk: "TORWART",
    roleField: "FELDSPIELER",
    squadRecord: "{{played}} gespielt / {{total}} Kader",
    balance: "Bilanz: {{w}}S - {{d}}U - {{l}}N",
    generated: "Erstellt: {{date}}",
    avgRatingLabel: "DURCHSCHNITT",
    bestWorstRating: "Beste: {{best}}  |  Schl.: {{worst}}",
    sectionSummary: "1. SAISONSUMMEN & PRO-SPIEL-DURCHSCHNITTE",
    sectionTactics: "2. TAKTISCHE WURFVERTEILUNG",
    sectionMatches: "3. ALLE SPIELE IM DETAIL ({{count}})",
    sectionMatchesNoNum: "2. ALLE SPIELE IM DETAIL ({{count}})",
    cardSaves: "Paraden / Würfe gg. Tor",
    cardXSaves: "xSaves (Erwartet)",
    cardGoals: "Tore / Würfe",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Spielzeit",
    cardDiscipline: "Fehler & Strafen",
    avgPrefix: "Schnitt",
    savesPerMatchShort: "Par/Sp",
    shotsFacedShort: "Wrf/Sp",
    goalsPerMatchShort: "T/Sp",
    shotsPerMatchShort: "W/Sp",
    perMatchUnit: "/Sp",
    diffLabel: "Diff",
    stealsLabel: "Ballg.",
    exclShort: "2'",
    colMetric: "Kennzahl / Metrik",
    colTotal: "Gesamt",
    colAverage: "Schnitt / Spiel",
    colRatio: "Referenz / Quote",
    rowMatches: "Spiele absolviert",
    rowMinutes: "Spielminuten",
    rowRating: "Handtix Bewertung (0-10)",
    rowSaves: "Torwart-Paraden",
    rowShotsFaced: "Würfe aufs Tor / xSaves",
    rowGoals: "Erzielte Tore",
    rowShots: "Gesamte Würfe",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Technische Fehler",
    rowSteals: "Ballgewinne",
    row7m: "7-Meter (Herausg. / Ver.)",
    rowOffFouls: "Stürmerfouls (Herausg. / Beg.)",
    rowSanctions: "Strafen (2' / G / R / Bl)",
    participationRate: "{{pct}}% Einsatzquote",
    efficiencySuffix: "Quote {{pct}}%",
    savePctSuffix: "Fangquote {{pct}}%",
    provComHint: "Herausgeholt / Verursacht",
    phasesTitle: "Angriffsphasen",
    zonesTitle: "Wurfzonen",
    phasePos: "Positionsspiel",
    phase1st: "Tempogegenstoß 1.",
    phase2nd: "2. Welle",
    phase7m: "Siebenmeter (7m)",
    zoneBackcourt: "Rückraum (9m)",
    zoneWing: "Außen",
    zonePivot: "Kreis",
    zone7m: "7-Meter",
    zoneFastbreak: "Gegenstoß",
    zoneOther: "Andere Zonen",
    tblDate: "Datum",
    tblOpponent: "Gegner (H/A)",
    tblScore: "Ergebn.",
    tblMin: "Min",
    tblSavesFaced: "Par/W",
    tblSavePct: "Par%",
    tblXSaves: "xSv",
    tblGoalsShots: "T/W",
    tblEff: "Ef%",
    tblXg: "xG",
    tblTurnovers: "TF",
    tbl7m: "7m +/-",
    tbl2Min: "2'",
    tblRating: "Bew",
    totalRowLabel: "GESAMT ({{count}} Spiele)",
    avgRowLabel: "SCHNITT / SPIEL ({{count}} Sp.)",
    noMatchesText: "Für diesen Spieler liegen noch keine Spieldaten vor.",
    homeTag: "(H)",
    awayTag: "(A)",
    winChar: "S",
    drawChar: "U",
    lossChar: "N",
    dnpLabel: "DNP",
    footerLeft: "Handtix Pro  |  Einzelspieler-Leistungsbericht",
    pageOf: "Seite {{current}} von {{total}}",
    runningHeader: "HANDTIX PRO  |  Spielerbericht: #{{number}} {{name}} ({{team}})"
  },
  fr: {
    headerTag: "RAPPORT INDIVIDUEL DE JOUEUR",
    roleGk: "GARDIEN DE BUT",
    roleField: "JOUEUR DE CHAMP",
    squadRecord: "{{played}} joués / {{total}} feuilles",
    balance: "Bilan : {{w}}V - {{d}}N - {{l}}D",
    generated: "Généré : {{date}}",
    avgRatingLabel: "NOTE MOYENNE",
    bestWorstRating: "Meill. : {{best}}  |  Moins b. : {{worst}}",
    sectionSummary: "1. TOTAUX SAISON ET MOYENNES PAR MATCH",
    sectionTactics: "2. RÉPARTITION TACTIQUE DES TIRS",
    sectionMatches: "3. DÉTAIL COMPLET DES MATCHS ({{count}})",
    sectionMatchesNoNum: "2. DÉTAIL COMPLET DES MATCHS ({{count}})",
    cardSaves: "Arrêts / Tirs subis",
    cardXSaves: "xSaves (Attendus)",
    cardGoals: "Buts / Tirs",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Temps de jeu",
    cardDiscipline: "Pertes & Sanctions",
    avgPrefix: "Moy",
    savesPerMatchShort: "arr/m",
    shotsFacedShort: "sub/m",
    goalsPerMatchShort: "b/m",
    shotsPerMatchShort: "t/m",
    perMatchUnit: "/m",
    diffLabel: "Diff",
    stealsLabel: "Int.",
    exclShort: "2'",
    colMetric: "Indicateur / Statistique",
    colTotal: "Total Saison",
    colAverage: "Moyenne / Match",
    colRatio: "Référence / Ratio",
    rowMatches: "Matchs joués",
    rowMinutes: "Minutes jouées",
    rowRating: "Note Handtix (0-10)",
    rowSaves: "Arrêts du gardien",
    rowShotsFaced: "Tirs subis / xSaves",
    rowGoals: "Buts marqués",
    rowShots: "Tirs tentés",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Pertes de balle",
    rowSteals: "Interceptions / Récup.",
    row7m: "7 mètres (Obt. / Conc.)",
    rowOffFouls: "Passages en force (Obt. / Com.)",
    rowSanctions: "Sanctions (2' / J / R / Bl)",
    participationRate: "{{pct}}% de participation",
    efficiencySuffix: "réussite {{pct}}%",
    savePctSuffix: "efficacité {{pct}}%",
    provComHint: "Obtenus / Concédés",
    phasesTitle: "Phases de jeu",
    zonesTitle: "Zones de tir",
    phasePos: "Attaque placée",
    phase1st: "Contre-attaque 1ère",
    phase2nd: "2ème vague",
    phase7m: "Jet de 7m",
    zoneBackcourt: "Base arrière (9m)",
    zoneWing: "Aile",
    zonePivot: "Pivot",
    zone7m: "7 Mètres",
    zoneFastbreak: "Contre-attaque",
    zoneOther: "Autres zones",
    tblDate: "Date",
    tblOpponent: "Adversaire (D/E)",
    tblScore: "Score",
    tblMin: "Min",
    tblSavesFaced: "Arr/Sub",
    tblSavePct: "%Arr",
    tblXSaves: "xSv",
    tblGoalsShots: "B/T",
    tblEff: "%Réu",
    tblXg: "xG",
    tblTurnovers: "PB",
    tbl7m: "7m O/C",
    tbl2Min: "2'",
    tblRating: "Note",
    totalRowLabel: "TOTAUX ({{count}} matchs)",
    avgRowLabel: "MOYENNE / MATCH ({{count}} j.)",
    noMatchesText: "Aucun match enregistré pour ce joueur.",
    homeTag: "(D)",
    awayTag: "(E)",
    winChar: "V",
    drawChar: "N",
    lossChar: "D",
    dnpLabel: "N/J",
    footerLeft: "Handtix Pro  |  Rapport Individuel de Performance",
    pageOf: "Page {{current}} sur {{total}}",
    runningHeader: "HANDTIX PRO  |  Rapport Joueur : #{{number}} {{name}} ({{team}})"
  },
  da: {
    headerTag: "INDIVIDUEL SPILLERRAPPORT",
    roleGk: "MÅLMAND",
    roleField: "MARKSPILLER",
    squadRecord: "{{played}} spillet / {{total}} trup",
    balance: "Statistik: {{w}}V - {{d}}U - {{l}}T",
    generated: "Genereret: {{date}}",
    avgRatingLabel: "GNS. RATING",
    bestWorstRating: "Bedst: {{best}}  |  Lavest: {{worst}}",
    sectionSummary: "1. SÆSONTOTALER & GENNEMSNIT PR. KAMP",
    sectionTactics: "2. TAKTISK SKUDFORDELING",
    sectionMatches: "3. ALLE KAMPE I DETALJER ({{count}})",
    sectionMatchesNoNum: "2. ALLE KAMPE I DETALJER ({{count}})",
    cardSaves: "Redninger / Skud imod",
    cardXSaves: "xSaves (Forventet)",
    cardGoals: "Mål / Skud",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Spilletid",
    cardDiscipline: "Fejl & Udvisninger",
    avgPrefix: "Gns",
    savesPerMatchShort: "red/k",
    shotsFacedShort: "sk/k",
    goalsPerMatchShort: "m/k",
    shotsPerMatchShort: "sk/k",
    perMatchUnit: "/k",
    diffLabel: "Diff",
    stealsLabel: "Erobr.",
    exclShort: "2'",
    colMetric: "Indikator / Statistik",
    colTotal: "Sæson Total",
    colAverage: "Gns. pr. kamp",
    colRatio: "Reference / Rate",
    rowMatches: "Kampe spillet",
    rowMinutes: "Minutter spillet",
    rowRating: "Handtix Rating (0-10)",
    rowSaves: "Målmandsredninger",
    rowShotsFaced: "Skud imod / xSaves",
    rowGoals: "Mål scoret",
    rowShots: "Samlede skud",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Tekniske fejl",
    rowSteals: "Bolderobringer",
    row7m: "7-meter (Tilk. / Begået)",
    rowOffFouls: "Angrebsfejl (Tilk. / Beg.)",
    rowSanctions: "Straffe (2' / G / R / Bl)",
    participationRate: "{{pct}}% deltagelse",
    efficiencySuffix: "udnyttelse {{pct}}%",
    savePctSuffix: "redningspct {{pct}}%",
    provComHint: "Tilkæmpet / Begået",
    phasesTitle: "Angrebsfaser",
    zonesTitle: "Skudzoner",
    phasePos: "Etableret angreb",
    phase1st: "Kontra 1. bølge",
    phase2nd: "2. bølge",
    phase7m: "Straffekast (7m)",
    zoneBackcourt: "Bagkæde (9m)",
    zoneWing: "Fløj",
    zonePivot: "Streg",
    zone7m: "7-Meter",
    zoneFastbreak: "Kontra",
    zoneOther: "Andre zoner",
    tblDate: "Dato",
    tblOpponent: "Modstander (H/U)",
    tblScore: "Resultat",
    tblMin: "Min",
    tblSavesFaced: "Red/Sk",
    tblSavePct: "Red%",
    tblXSaves: "xSv",
    tblGoalsShots: "M/S",
    tblEff: "Ef%",
    tblXg: "xG",
    tblTurnovers: "TF",
    tbl7m: "7m T/B",
    tbl2Min: "2'",
    tblRating: "Rat",
    totalRowLabel: "TOTAL ({{count}} kampe)",
    avgRowLabel: "GNS. PR. KAMP ({{count}} sp.)",
    noMatchesText: "Ingen kampe registreret for denne spiller endnu.",
    homeTag: "(H)",
    awayTag: "(U)",
    winChar: "V",
    drawChar: "U",
    lossChar: "T",
    dnpLabel: "DNP",
    footerLeft: "Handtix Pro  |  Individuel Spillerrapport",
    pageOf: "Side {{current}} af {{total}}",
    runningHeader: "HANDTIX PRO  |  Spillerrapport: #{{number}} {{name}} ({{team}})"
  },
  pl: {
    headerTag: "INDYWIDUALNY RAPORT ZAWODNIKA",
    roleGk: "BRAMKARZ",
    roleField: "ZAWODNIK Z POLA",
    squadRecord: "{{played}} rozegranych / {{total}} w kadrze",
    balance: "Bilans: {{w}}Z - {{d}}R - {{l}}P",
    generated: "Wygenerowano: {{date}}",
    avgRatingLabel: "SREDNIA OCENA",
    bestWorstRating: "Najl.: {{best}}  |  Najsl.: {{worst}}",
    sectionSummary: "1. SUMY SEZONOWE I SREDNIE NA MECZ",
    sectionTactics: "2. ROZKLAD TAKTYCZNY RZUTOW",
    sectionMatches: "3. PELNA LISTA MECZOW ({{count}})",
    sectionMatchesNoNum: "2. PELNA LISTA MECZOW ({{count}})",
    cardSaves: "Obrony / Rzuty na bramke",
    cardXSaves: "xSaves (Oczekiwane)",
    cardGoals: "Bramki / Rzuty",
    cardXg: "Expected Goals (xG)",
    cardMinutes: "Czas na boisku",
    cardDiscipline: "Straty i Kary",
    avgPrefix: "Sr",
    savesPerMatchShort: "obr/m",
    shotsFacedShort: "rz/m",
    goalsPerMatchShort: "br/m",
    shotsPerMatchShort: "rz/m",
    perMatchUnit: "/m",
    diffLabel: "Rozn",
    stealsLabel: "Przechw.",
    exclShort: "2'",
    colMetric: "Wskaznik / Statystyka",
    colTotal: "Suma Sezonu",
    colAverage: "Srednia / Mecz",
    colRatio: "Odnosnik / Procent",
    rowMatches: "Rozegrane mecze",
    rowMinutes: "Minuty na boisku",
    rowRating: "Ocena Handtix (0-10)",
    rowSaves: "Interwencje bramkarza",
    rowShotsFaced: "Rzuty przyjete / xSaves",
    rowGoals: "Zdobyte bramki",
    rowShots: "Oddane rzuty",
    rowXg: "Expected Goals (xG)",
    rowTurnovers: "Straty pilki",
    rowSteals: "Przechwyty",
    row7m: "Rzuty karne 7m (Wyw. / Pop.)",
    rowOffFouls: "Faule w ataku (Wyw. / Pop.)",
    rowSanctions: "Kary (2' / Z / Cz / N)",
    participationRate: "{{pct}}% wystepow",
    efficiencySuffix: "skutecznosc {{pct}}%",
    savePctSuffix: "skutecznosc {{pct}}%",
    provComHint: "Wywalczone / Popelnione",
    phasesTitle: "Fazy ataku",
    zonesTitle: "Strefy rzutow",
    phasePos: "Atak pozycyjny",
    phase1st: "Kontratak 1. fala",
    phase2nd: "2. fala",
    phase7m: "Rzut karny (7m)",
    zoneBackcourt: "Druga linia (9m)",
    zoneWing: "Skrzydlo",
    zonePivot: "Obrotowy",
    zone7m: "7 Metrow",
    zoneFastbreak: "Kontratak",
    zoneOther: "Inne strefy",
    tblDate: "Data",
    tblOpponent: "Rywal (D/W)",
    tblScore: "Wynik",
    tblMin: "Min",
    tblSavesFaced: "Obr/Rz",
    tblSavePct: "%Obr",
    tblXSaves: "xSv",
    tblGoalsShots: "B/R",
    tblEff: "%Sk",
    tblXg: "xG",
    tblTurnovers: "Str",
    tbl7m: "7m W/P",
    tbl2Min: "2'",
    tblRating: "Ocena",
    totalRowLabel: "SUMA ({{count}} meczow)",
    avgRowLabel: "SREDNIA / MECZ ({{count}} r.)",
    noMatchesText: "Ten zawodnik nie ma jeszcze zarejestrowanych meczow.",
    homeTag: "(D)",
    awayTag: "(W)",
    winChar: "Z",
    drawChar: "R",
    lossChar: "P",
    dnpLabel: "NP",
    footerLeft: "Handtix Pro  |  Indywidualny Raport Zawodnika",
    pageOf: "Strona {{current}} z {{total}}",
    runningHeader: "HANDTIX PRO  |  Raport Zawodnika: #{{number}} {{name}} ({{team}})"
  }
};

function getTexts(lang = "es") {
  const short = String(lang || "es").split("-")[0].toLowerCase();
  return REPORT_TEXTS[short] || REPORT_TEXTS.es;
}

function interpolate(str, vars = {}) {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, String(val ?? "")),
    String(str || "")
  );
}

/**
 * Normaliza caracteres fuera de WinAnsi (ej. polaco o guiones largos) para la fuente Helvetica de jsPDF.
 */
export function toPdfSafeText(value) {
  return String(value ?? "")
    .replace(/[\u0104\u0105\u0106\u0107\u0118\u0119\u0141\u0142\u0143\u0144\u00D3\u00F3\u015A\u015B\u0179\u017A\u017B\u017C\u2014\u2013\u2212]/g, (ch) => POLISH_CHAR_MAP[ch] || ch);
}

export function formatSecondsToClock(totalSeconds) {
  const secs = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function formatShortDate(dateValue) {
  if (!dateValue) return "-";
  const raw = String(dateValue).trim();
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1].slice(-2)}`;
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  const d = String(parsed.getDate()).padStart(2, "0");
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const y = String(parsed.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

function parseFinite(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatSigned(num, decimals = 1) {
  const val = Number(num) || 0;
  const fixed = Math.abs(val) < 1e-9 ? (0).toFixed(decimals) : val.toFixed(decimals);
  return val > 0 ? `+${fixed}` : fixed;
}

function fitTextToWidth(pdf, text, maxWidth) {
  const safe = toPdfSafeText(text);
  if (!safe) return "";
  if (pdf.getTextWidth(safe) <= maxWidth) return safe;
  let clipped = safe;
  while (clipped.length > 1 && pdf.getTextWidth(`${clipped}...`) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

export function sanitizeReportFilename(name, number) {
  const cleanName = String(name || "Jugador")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "Jugador";
  const prefix = number !== undefined && number !== null && String(number).trim() !== ""
    ? `${String(number).trim()}-`
    : "";
  return `Handtix_Informe_${prefix}${cleanName}.pdf`;
}

/**
 * Calcula totales acumulados, balance W/D/L y promedios por partido de un jugador.
 * Soporta tanto objetos completos de `teamCumulativeEngine` como estructuras resumidas.
 */
export function computePlayerReportSummary(player = {}) {
  const rawMatches = Array.isArray(player?.matches) ? player.matches : [];
  const isGoalkeeper = player?.is_goalkeeper === true || player?.is_goalkeeper === "true";

  // Ordenar cronológicamente de más antiguo a más reciente para lectura de informe
  const chronologicalMatches = rawMatches
    .map((m, idx) => ({ match: m || {}, idx }))
    .sort((a, b) => {
      const tA = a.match.date ? new Date(a.match.date).getTime() : 0;
      const tB = b.match.date ? new Date(b.match.date).getTime() : 0;
      if (tA !== tB) return tA - tB;
      return a.idx - b.idx;
    })
    .map(({ match }) => match);

  const playedList = chronologicalMatches.filter((m) => m.played !== false);
  const matchesPlayedFromList = playedList.length > 0 ? playedList.length : chronologicalMatches.length;
  const matchesPlayed = chronologicalMatches.length > 0
    ? matchesPlayedFromList
    : Math.max(0, Math.round(parseFinite(player?.matchesPlayed, 0)));
  const totalSquadMatches = Math.max(
    chronologicalMatches.length,
    Math.round(parseFinite(player?.totalMatchesInSquad, matchesPlayed))
  );

  const sumMatches = (getter) =>
    chronologicalMatches.reduce((acc, m) => acc + parseFinite(getter(m), 0), 0);

  const pickTotal = (topField, matchGetter) => {
    const topVal = player?.[topField];
    if (topVal !== undefined && topVal !== null && topVal !== "") {
      return parseFinite(topVal, 0);
    }
    return sumMatches(matchGetter);
  };

  const goals = Math.round(pickTotal("goals", (m) => m.goals));
  const shotsCount = Math.round(pickTotal("shotsCount", (m) => m.shotsCount));
  const totalXg = pickTotal("xg", (m) => m.xg);
  const saves = Math.round(pickTotal("saves", (m) => m.saves));
  const shotsFaced = Math.round(pickTotal("shotsFaced", (m) => m.shotsFaced));
  const totalXSaves = pickTotal("goalkeeperXSaves", (m) => m.goalkeeperXSaves);
  const turnovers = Math.round(pickTotal("turnovers", (m) => m.turnovers));
  const steals = Math.round(pickTotal("steals", (m) => m.steals));
  const drawn7mCount = Math.round(pickTotal("drawn7mCount", (m) => m.drawn7mCount));
  const penaltiesCommitted = Math.round(pickTotal("penaltiesCommitted", (m) => m.penaltiesCommitted));
  const offFoulsDrawn = Math.round(pickTotal("offFoulsDrawn", (m) => m.offFoulsDrawn));
  const offensiveFouls = Math.round(pickTotal("offensiveFouls", (m) => m.offensiveFouls));
  const twoMins = Math.round(pickTotal("twoMins", (m) => m.twoMins));
  const yellowCards = Math.round(pickTotal("yellowCards", (m) => m.yellowCards));
  const redCards = Math.round(pickTotal("redCards", (m) => m.redCards));
  const blueCards = Math.round(pickTotal("blueCards", (m) => m.blueCards));

  const totalSeconds = player?.secondsPlayed !== undefined && player?.secondsPlayed !== null
    ? parseFinite(player.secondsPlayed, 0)
    : sumMatches((m) => (
      m.secondsPlayed !== undefined
        ? parseFinite(m.secondsPlayed, 0)
        : parseFinite(m.minutesPlayed, 0) * 60
    ));

  const denom = matchesPlayed > 0 ? matchesPlayed : 0;
  const efficiency = shotsCount > 0 ? Math.round((goals / shotsCount) * 100) : Math.round(parseFinite(player?.efficiency, 0));
  const savePct = shotsFaced > 0 ? Math.round((saves / shotsFaced) * 100) : Math.round(parseFinite(player?.savePct, 0));

  let wins = 0;
  let draws = 0;
  let losses = 0;
  const ratingTargetList = playedList.length > 0 ? playedList : chronologicalMatches;
  const ratings = [];

  chronologicalMatches.forEach((m) => {
    const res = String(m.result || "").toUpperCase();
    if (res === "W") wins += 1;
    else if (res === "D") draws += 1;
    else if (res === "L") losses += 1;
    else if (m.teamGoals !== undefined && m.oppGoals !== undefined) {
      if (Number(m.teamGoals) > Number(m.oppGoals)) wins += 1;
      else if (Number(m.teamGoals) === Number(m.oppGoals)) draws += 1;
      else losses += 1;
    }
  });

  ratingTargetList.forEach((m) => {
    if (m.rating !== undefined && m.rating !== null && m.rating !== "") {
      const r = Number(m.rating);
      if (Number.isFinite(r)) ratings.push(r);
    }
  });

  const computedAvgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const avgRating = player?.avgRating !== undefined && player?.avgRating !== null && player?.avgRating !== ""
    ? parseFinite(player.avgRating, 0).toFixed(1)
    : (computedAvgRating ?? "-");

  const hasValidBest = player?.bestRating && player.bestRating !== "-" && player.bestRating !== "\u2014";
  const hasValidWorst = player?.worstRating && player.worstRating !== "-" && player.worstRating !== "\u2014";
  const bestRating = hasValidBest
    ? parseFinite(player.bestRating, 0).toFixed(1)
    : (ratings.length > 0 ? Math.max(...ratings).toFixed(1) : "-");
  const worstRating = hasValidWorst
    ? parseFinite(player.worstRating, 0).toFixed(1)
    : (ratings.length > 0 ? Math.min(...ratings).toFixed(1) : "-");

  const totalMinutesFormatted = player?.totalMinutesFormatted && totalSeconds === 0
    ? String(player.totalMinutesFormatted)
    : formatSecondsToClock(totalSeconds);
  const avgSeconds = denom > 0 ? Math.round(totalSeconds / denom) : 0;
  const avgMinutesFormatted = player?.avgMinutesPlayedFormatted && totalSeconds === 0
    ? String(player.avgMinutesPlayedFormatted)
    : formatSecondsToClock(avgSeconds);

  const avg = (total, dec = 1) => (denom > 0 ? (total / denom).toFixed(dec) : (0).toFixed(dec));

  return {
    number: player?.number ?? "-",
    name: String(player?.name || "Jugador"),
    isGoalkeeper,
    matchesPlayed,
    totalSquadMatches,
    participationPct: totalSquadMatches > 0 ? Math.round((matchesPlayed / totalSquadMatches) * 100) : 0,
    wins,
    draws,
    losses,
    totals: {
      secondsPlayed: totalSeconds,
      minutesFormatted: totalMinutesFormatted,
      goals,
      shotsCount,
      efficiency,
      xg: Number(totalXg.toFixed(2)),
      goalsMinusXg: Number((goals - totalXg).toFixed(2)),
      saves,
      shotsFaced,
      savePct,
      goalkeeperXSaves: Number(totalXSaves.toFixed(1)),
      savesMinusXSaves: Number((saves - totalXSaves).toFixed(1)),
      turnovers,
      steals,
      drawn7mCount,
      penaltiesCommitted,
      offFoulsDrawn,
      offensiveFouls,
      twoMins,
      yellowCards,
      redCards,
      blueCards
    },
    averages: {
      secondsPlayed: avgSeconds,
      minutesFormatted: avgMinutesFormatted,
      rating: avgRating,
      bestRating,
      worstRating,
      goals: avg(goals, 1),
      shotsCount: avg(shotsCount, 1),
      xg: avg(totalXg, 2),
      saves: avg(saves, 1),
      shotsFaced: avg(shotsFaced, 1),
      goalkeeperXSaves: avg(totalXSaves, 1),
      turnovers: avg(turnovers, 1),
      steals: avg(steals, 1),
      drawn7mCount: avg(drawn7mCount, 1),
      penaltiesCommitted: avg(penaltiesCommitted, 1),
      offFoulsDrawn: avg(offFoulsDrawn, 1),
      offensiveFouls: avg(offensiveFouls, 1),
      twoMins: avg(twoMins, 2)
    },
    shotPhases: player?.shotPhases || null,
    shotZones: player?.shotZones || null,
    matches: chronologicalMatches
  };
}

function drawCoverHeader(pdf, summary, team, texts) {
  let y = 11;

  // Marca HANDTIX PRO arriba
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
  pdf.text("HAND", MARGIN_X, y + 4);
  pdf.setTextColor(...PLAYER_PDF_COLORS.primary);
  pdf.text("TIX", MARGIN_X + 18.8, y + 4);

  pdf.setFillColor(...PLAYER_PDF_COLORS.primary);
  pdf.roundedRect(MARGIN_X + 31, y - 0.8, 12.5, 5.8, 1.5, 1.5, "F");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...PLAYER_PDF_COLORS.white);
  pdf.text("PRO", MARGIN_X + 37.25, y + 3.2, { align: "center" });

  // Etiqueta derecha y fecha
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...PLAYER_PDF_COLORS.primary);
  pdf.text(toPdfSafeText(texts.headerTag), PAGE_WIDTH - MARGIN_X, y + 1.5, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
  const todayStr = formatShortDate(new Date().toISOString().slice(0, 10));
  pdf.text(toPdfSafeText(interpolate(texts.generated, { date: todayStr })), PAGE_WIDTH - MARGIN_X, y + 5.8, { align: "right" });

  y += 10;

  // Tarjeta Hero de Identidad del Jugador
  const heroHeight = 25;
  pdf.setFillColor(...PLAYER_PDF_COLORS.bgLight);
  pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, heroHeight, 2.5, 2.5, "FD");

  // Barra lateral izquierda de rol
  const roleAccent = summary.isGoalkeeper ? PLAYER_PDF_COLORS.primary : PLAYER_PDF_COLORS.tactical;
  pdf.setFillColor(...roleAccent);
  pdf.rect(MARGIN_X, y, 2.8, heroHeight, "F");

  // Caja Dorsal #
  pdf.setFillColor(...PLAYER_PDF_COLORS.primarySoft);
  pdf.setDrawColor(...PLAYER_PDF_COLORS.primary);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(MARGIN_X + 6, y + 4, 17, 17, 2.5, 2.5, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...PLAYER_PDF_COLORS.primary);
  pdf.text(toPdfSafeText(`#${summary.number}`), MARGIN_X + 14.5, y + 14.5, { align: "center" });

  // Nombre y Metadatos
  const infoX = MARGIN_X + 27;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14.5);
  pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
  const displayName = fitTextToWidth(pdf, summary.name, 95);
  pdf.text(displayName, infoX, y + 8.5);

  // Pill de Rol
  const roleLabel = summary.isGoalkeeper ? texts.roleGk : texts.roleField;
  const roleFill = summary.isGoalkeeper ? PLAYER_PDF_COLORS.primarySoft : PLAYER_PDF_COLORS.tacticalSoft;
  const roleWidth = Math.max(24, pdf.getTextWidth(toPdfSafeText(roleLabel)) + 6);
  pdf.setFillColor(...roleFill);
  pdf.roundedRect(infoX, y + 11.2, roleWidth, 5.2, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.8);
  pdf.setTextColor(...roleAccent);
  pdf.text(toPdfSafeText(roleLabel), infoX + roleWidth / 2, y + 14.8, { align: "center" });

  // Nombre de equipo junto al rol
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.2);
  pdf.setTextColor(...PLAYER_PDF_COLORS.text);
  const teamName = fitTextToWidth(pdf, team?.name || "Handtix Club", 70);
  pdf.text(teamName, infoX + roleWidth + 3.5, y + 14.8);

  // Linea inferior de convocatoria + W-D-L
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.6);
  pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
  const squadMeta = `${interpolate(texts.squadRecord, {
    played: summary.matchesPlayed,
    total: summary.totalSquadMatches
  })}   |   ${interpolate(texts.balance, {
    w: summary.wins,
    d: summary.draws,
    l: summary.losses
  })}`;
  pdf.text(toPdfSafeText(squadMeta), infoX, y + 21.2);

  // Caja derecha de Rating Medio
  const ratingBoxW = 46;
  const ratingBoxX = MARGIN_X + CONTENT_WIDTH - ratingBoxW - 3.5;
  pdf.setFillColor(...PLAYER_PDF_COLORS.white);
  pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(ratingBoxX, y + 2.8, ratingBoxW, heroHeight - 5.6, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.6);
  pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
  pdf.text(toPdfSafeText(texts.avgRatingLabel), ratingBoxX + ratingBoxW / 2, y + 7.2, { align: "center" });

  const ratingNum = Number(summary.averages.rating);
  const ratingColor = Number.isFinite(ratingNum)
    ? (ratingNum >= 7.5 ? PLAYER_PDF_COLORS.primary : ratingNum >= 5.5 ? PLAYER_PDF_COLORS.secondary : PLAYER_PDF_COLORS.danger)
    : PLAYER_PDF_COLORS.text;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...ratingColor);
  pdf.text(toPdfSafeText(summary.averages.rating), ratingBoxX + ratingBoxW / 2, y + 14.8, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
  pdf.text(
    toPdfSafeText(interpolate(texts.bestWorstRating, {
      best: summary.averages.bestRating,
      worst: summary.averages.worstRating
    })),
    ratingBoxX + ratingBoxW / 2,
    y + 19.8,
    { align: "center" }
  );

  return y + heroHeight + 6;
}

function drawSectionHeading(pdf, title, y) {
  pdf.setFillColor(...PLAYER_PDF_COLORS.primary);
  pdf.rect(MARGIN_X, y, 2.5, 5.2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
  pdf.text(toPdfSafeText(title), MARGIN_X + 5, y + 4.1);

  pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, y + 6.8, MARGIN_X + CONTENT_WIDTH, y + 6.8);
  return y + 9.5;
}

function drawKpiHighlightCards(pdf, summary, texts, startY) {
  const { totals, averages, isGoalkeeper } = summary;
  const cards = isGoalkeeper
    ? [
        {
          label: texts.cardSaves,
          main: `${totals.saves} / ${totals.shotsFaced} (${totals.savePct}%)`,
          sub: `${texts.avgPrefix}: ${averages.saves} ${texts.savesPerMatchShort} | ${averages.shotsFaced} ${texts.shotsFacedShort}`,
          accent: PLAYER_PDF_COLORS.primary
        },
        {
          label: texts.cardXSaves,
          main: `${totals.goalkeeperXSaves.toFixed(1)} (${formatSigned(totals.savesMinusXSaves, 1)})`,
          sub: `${texts.avgPrefix}: ${averages.goalkeeperXSaves} xSv${texts.perMatchUnit}`,
          accent: PLAYER_PDF_COLORS.tactical
        },
        {
          label: texts.cardGoals,
          main: `${totals.goals} / ${totals.shotsCount} (${totals.efficiency}%)`,
          sub: `${texts.avgPrefix}: ${averages.goals} ${texts.goalsPerMatchShort} | xG ${averages.xg}${texts.perMatchUnit}`,
          accent: PLAYER_PDF_COLORS.secondary
        },
        {
          label: texts.cardMinutes,
          main: `${totals.minutesFormatted}`,
          sub: `${texts.avgPrefix}: ${averages.minutesFormatted}${texts.perMatchUnit} | ${totals.twoMins}x2'`,
          accent: PLAYER_PDF_COLORS.dark
        }
      ]
    : [
        {
          label: texts.cardGoals,
          main: `${totals.goals} / ${totals.shotsCount} (${totals.efficiency}%)`,
          sub: `${texts.avgPrefix}: ${averages.goals} ${texts.goalsPerMatchShort} | ${averages.shotsCount} ${texts.shotsPerMatchShort}`,
          accent: PLAYER_PDF_COLORS.primary
        },
        {
          label: texts.cardXg,
          main: `${totals.xg.toFixed(2)} (${formatSigned(totals.goalsMinusXg, 2)})`,
          sub: `${texts.avgPrefix}: ${averages.xg} xG${texts.perMatchUnit}`,
          accent: PLAYER_PDF_COLORS.tactical
        },
        {
          label: texts.cardMinutes,
          main: `${totals.minutesFormatted}`,
          sub: `${texts.avgPrefix}: ${averages.minutesFormatted}${texts.perMatchUnit}`,
          accent: PLAYER_PDF_COLORS.secondary
        },
        {
          label: texts.cardDiscipline,
          main: `${totals.turnovers} / ${totals.twoMins}x2'`,
          sub: `${texts.avgPrefix}: ${averages.turnovers}${texts.perMatchUnit} | ${texts.stealsLabel}: ${totals.steals}`,
          accent: PLAYER_PDF_COLORS.danger
        }
      ];

  const gap = 3;
  const cardW = (CONTENT_WIDTH - gap * 3) / 4;
  const cardH = 19;

  cards.forEach((card, idx) => {
    const x = MARGIN_X + idx * (cardW + gap);
    pdf.setFillColor(...PLAYER_PDF_COLORS.white);
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x, startY, cardW, cardH, 2, 2, "FD");

    pdf.setFillColor(...card.accent);
    pdf.rect(x, startY, cardW, 1.8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.6);
    pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
    pdf.text(fitTextToWidth(pdf, card.label.toUpperCase(), cardW - 5), x + 2.8, startY + 6.2);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
    pdf.text(fitTextToWidth(pdf, card.main, cardW - 5), x + 2.8, startY + 11.8);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.8);
    pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
    pdf.text(fitTextToWidth(pdf, card.sub, cardW - 5), x + 2.8, startY + 16.4);
  });

  return startY + cardH + 5;
}

function drawSummaryComparisonTable(pdf, summary, texts, startY) {
  const { totals, averages, isGoalkeeper } = summary;
  const cols = [
    { label: texts.colMetric, width: 68, align: "left" },
    { label: texts.colTotal, width: 38, align: "right" },
    { label: texts.colAverage, width: 38, align: "right" },
    { label: texts.colRatio, width: 38, align: "right" }
  ];

  const rows = [
    {
      metric: texts.rowMatches,
      total: `${summary.matchesPlayed} / ${summary.totalSquadMatches}`,
      avg: `${summary.wins}W - ${summary.draws}D - ${summary.losses}L`.replace("W", texts.winChar).replace("D", texts.drawChar).replace("L", texts.lossChar),
      ratio: interpolate(texts.participationRate, { pct: summary.participationPct })
    },
    {
      metric: texts.rowMinutes,
      total: totals.minutesFormatted,
      avg: `${averages.minutesFormatted}${texts.perMatchUnit}`,
      ratio: `${Math.round(totals.secondsPlayed / 60)} min`
    },
    {
      metric: texts.rowRating,
      total: averages.rating,
      avg: averages.rating,
      ratio: interpolate(texts.bestWorstRating, { best: averages.bestRating, worst: averages.worstRating })
    }
  ];

  if (isGoalkeeper) {
    rows.push(
      {
        metric: texts.rowSaves,
        total: String(totals.saves),
        avg: `${averages.saves}${texts.perMatchUnit}`,
        ratio: interpolate(texts.savePctSuffix, { pct: totals.savePct })
      },
      {
        metric: texts.rowShotsFaced,
        total: `${totals.shotsFaced} / ${totals.goalkeeperXSaves.toFixed(1)}`,
        avg: `${averages.shotsFaced} / ${averages.goalkeeperXSaves}`,
        ratio: `${texts.diffLabel} ${formatSigned(totals.savesMinusXSaves, 1)}`
      }
    );
  }

  rows.push(
    {
      metric: texts.rowGoals,
      total: String(totals.goals),
      avg: `${averages.goals}${texts.perMatchUnit}`,
      ratio: interpolate(texts.efficiencySuffix, { pct: totals.efficiency })
    },
    {
      metric: texts.rowShots,
      total: String(totals.shotsCount),
      avg: `${averages.shotsCount}${texts.perMatchUnit}`,
      ratio: `${totals.goals}/${totals.shotsCount}`
    },
    {
      metric: texts.rowXg,
      total: totals.xg.toFixed(2),
      avg: `${averages.xg}${texts.perMatchUnit}`,
      ratio: `${texts.diffLabel} G-xG: ${formatSigned(totals.goalsMinusXg, 2)}`
    },
    {
      metric: texts.rowTurnovers,
      total: String(totals.turnovers),
      avg: `${averages.turnovers}${texts.perMatchUnit}`,
      ratio: `${texts.stealsLabel}: ${totals.steals} (${averages.steals}${texts.perMatchUnit})`
    },
    {
      metric: texts.row7m,
      total: `${totals.drawn7mCount} / ${totals.penaltiesCommitted}`,
      avg: `${averages.drawn7mCount} / ${averages.penaltiesCommitted}`,
      ratio: texts.provComHint
    },
    {
      metric: texts.rowOffFouls,
      total: `${totals.offFoulsDrawn} / ${totals.offensiveFouls}`,
      avg: `${averages.offFoulsDrawn} / ${averages.offensiveFouls}`,
      ratio: texts.provComHint
    },
    {
      metric: texts.rowSanctions,
      total: `${totals.twoMins} / ${totals.yellowCards} / ${totals.redCards} / ${totals.blueCards}`,
      avg: `${averages.twoMins} ${texts.exclShort}${texts.perMatchUnit}`,
      ratio: `${totals.twoMins}x2'`
    }
  );

  let y = startY;
  const headerH = 7;
  const rowH = 6.2;

  // Cabecera de tabla comparativa
  pdf.setFillColor(...PLAYER_PDF_COLORS.dark);
  pdf.rect(MARGIN_X, y, CONTENT_WIDTH, headerH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.4);
  pdf.setTextColor(...PLAYER_PDF_COLORS.white);

  let curX = MARGIN_X;
  cols.forEach((col) => {
    const textX = col.align === "right" ? curX + col.width - 3 : curX + 3;
    pdf.text(toPdfSafeText(col.label), textX, y + 4.7, { align: col.align });
    curX += col.width;
  });
  y += headerH;

  rows.forEach((row, idx) => {
    pdf.setFillColor(...(idx % 2 === 0 ? PLAYER_PDF_COLORS.white : PLAYER_PDF_COLORS.bgLight));
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, rowH, "F");

    // Resaltado sutil verde en columna promedio
    pdf.setFillColor(...PLAYER_PDF_COLORS.primarySoft);
    pdf.rect(MARGIN_X + cols[0].width + cols[1].width, y, cols[2].width, rowH, "F");

    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_WIDTH, y + rowH);

    // Col 0: Indicador
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.4);
    pdf.setTextColor(...PLAYER_PDF_COLORS.text);
    pdf.text(fitTextToWidth(pdf, row.metric, cols[0].width - 5), MARGIN_X + 3, y + 4.3);

    // Col 1: Total
    const c1Right = MARGIN_X + cols[0].width + cols[1].width - 3;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
    pdf.text(fitTextToWidth(pdf, row.total, cols[1].width - 5), c1Right, y + 4.3, { align: "right" });

    // Col 2: Promedio
    const c2Right = MARGIN_X + cols[0].width + cols[1].width + cols[2].width - 3;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...PLAYER_PDF_COLORS.primary);
    pdf.text(fitTextToWidth(pdf, row.avg, cols[2].width - 5), c2Right, y + 4.3, { align: "right" });

    // Col 3: Referencia
    const c3Right = MARGIN_X + CONTENT_WIDTH - 3;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.1);
    pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
    pdf.text(fitTextToWidth(pdf, row.ratio, cols[3].width - 5), c3Right, y + 4.3, { align: "right" });

    y += rowH;
  });

  return y + 6;
}

function drawShotBreakdownSection(pdf, summary, texts, startY) {
  const { shotPhases, shotZones, totals } = summary;
  const totalShots = Math.max(1, totals.shotsCount);

  const phases = [
    { label: texts.phasePos, val: shotPhases?.posicional || 0, color: PLAYER_PDF_COLORS.tactical },
    { label: texts.phase1st, val: shotPhases?.oleada1 || 0, color: PLAYER_PDF_COLORS.primary },
    { label: texts.phase2nd, val: shotPhases?.oleada2 || 0, color: PLAYER_PDF_COLORS.secondary },
    { label: texts.phase7m, val: shotPhases?.penalti || 0, color: PLAYER_PDF_COLORS.danger }
  ];

  const allZones = [
    { label: texts.zoneBackcourt, val: shotZones?.backcourt || 0, color: PLAYER_PDF_COLORS.tactical },
    { label: texts.zoneWing, val: shotZones?.wing || 0, color: PLAYER_PDF_COLORS.primary },
    { label: texts.zonePivot, val: shotZones?.pivot || 0, color: PLAYER_PDF_COLORS.secondary },
    { label: texts.zone7m, val: shotZones?.sevenM || 0, color: PLAYER_PDF_COLORS.danger },
    { label: texts.zoneFastbreak, val: shotZones?.fastbreak || 0, color: PLAYER_PDF_COLORS.dark },
    { label: texts.zoneOther, val: shotZones?.other || 0, color: PLAYER_PDF_COLORS.textMuted }
  ];
  const nonZeroZones = allZones.filter((z) => z.val > 0);
  const zones = nonZeroZones.length > 0 ? allZones : allZones;

  const gap = 4;
  const boxW = (CONTENT_WIDTH - gap) / 2;
  const itemRowH = 6.2;
  const maxRows = Math.max(phases.length, Math.max(1, zones.length));
  const boxH = 10 + maxRows * itemRowH + 2;

  const drawBox = (x, title, items) => {
    pdf.setFillColor(...PLAYER_PDF_COLORS.bgLight);
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, startY, boxW, boxH, 2, 2, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.2);
    pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
    pdf.text(toPdfSafeText(title), x + 4, startY + 6);

    let iy = startY + 11.5;
    items.forEach((item) => {
      const pct = Math.round((item.val / totalShots) * 100);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.setTextColor(...PLAYER_PDF_COLORS.text);
      pdf.text(fitTextToWidth(pdf, item.label, 38), x + 4, iy);

      // Barra de progreso mini
      const barX = x + 44;
      const barW = boxW - 64;
      pdf.setFillColor(...PLAYER_PDF_COLORS.border);
      pdf.roundedRect(barX, iy - 2.3, barW, 2.2, 0.8, 0.8, "F");
      const fillW = Math.min(barW, Math.max(0, (pct / 100) * barW));
      if (fillW > 0) {
        pdf.setFillColor(...item.color);
        pdf.roundedRect(barX, iy - 2.3, fillW, 2.2, 0.8, 0.8, "F");
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.2);
      pdf.setTextColor(...PLAYER_PDF_COLORS.dark);
      pdf.text(`${item.val} (${pct}%)`, x + boxW - 3.5, iy, { align: "right" });

      iy += itemRowH;
    });
  };

  drawBox(MARGIN_X, texts.phasesTitle, phases);
  drawBox(MARGIN_X + boxW + gap, texts.zonesTitle, zones);

  return startY + boxH + 6;
}

function getMatchesTableColumns(summary, texts) {
  if (summary.isGoalkeeper) {
    return [
      { key: "date", label: texts.tblDate, width: 20, align: "left" },
      { key: "opponent", label: texts.tblOpponent, width: 44, align: "left" },
      { key: "score", label: texts.tblScore, width: 21, align: "center" },
      { key: "minutes", label: texts.tblMin, width: 13, align: "center" },
      { key: "savesFaced", label: texts.tblSavesFaced, width: 17, align: "center" },
      { key: "savePct", label: texts.tblSavePct, width: 12, align: "center" },
      { key: "xSaves", label: texts.tblXSaves, width: 12, align: "right" },
      { key: "goalsShots", label: texts.tblGoalsShots, width: 12, align: "center" },
      { key: "turnovers", label: texts.tblTurnovers, width: 10, align: "center" },
      { key: "twoMins", label: texts.tbl2Min, width: 9, align: "center" },
      { key: "rating", label: texts.tblRating, width: 12, align: "right" }
    ];
  }
  return [
    { key: "date", label: texts.tblDate, width: 20, align: "left" },
    { key: "opponent", label: texts.tblOpponent, width: 45, align: "left" },
    { key: "score", label: texts.tblScore, width: 21, align: "center" },
    { key: "minutes", label: texts.tblMin, width: 13, align: "center" },
    { key: "goalsShots", label: texts.tblGoalsShots, width: 14, align: "center" },
    { key: "eff", label: texts.tblEff, width: 12, align: "center" },
    { key: "xg", label: texts.tblXg, width: 12, align: "right" },
    { key: "turnovers", label: texts.tblTurnovers, width: 10, align: "center" },
    { key: "sevenM", label: texts.tbl7m, width: 13, align: "center" },
    { key: "twoMins", label: texts.tbl2Min, width: 9, align: "center" },
    { key: "rating", label: texts.tblRating, width: 13, align: "right" }
  ];
}

function drawMatchTableHeader(pdf, columns, y) {
  const headerH = 7;
  pdf.setFillColor(...PLAYER_PDF_COLORS.dark);
  pdf.rect(MARGIN_X, y, CONTENT_WIDTH, headerH, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...PLAYER_PDF_COLORS.white);

  let x = MARGIN_X;
  columns.forEach((col) => {
    const padX = col.align === "center" ? x + col.width / 2 : col.align === "right" ? x + col.width - 2 : x + 2;
    pdf.text(toPdfSafeText(col.label), padX, y + 4.7, { align: col.align });
    x += col.width;
  });

  return y + headerH;
}

function drawMatchCellText(pdf, col, x, y, text, color = PLAYER_PDF_COLORS.text, bold = false) {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(7.1);
  pdf.setTextColor(...color);
  const safeText = fitTextToWidth(pdf, text, col.width - 2.5);
  const textX = col.align === "center" ? x + col.width / 2 : col.align === "right" ? x + col.width - 2 : x + 2;
  pdf.text(safeText, textX, y, { align: col.align });
}

function drawMatchesLogTable(pdf, summary, texts, startY) {
  let y = startY;
  const { matches, isGoalkeeper, totals, averages } = summary;

  if (matches.length === 0) {
    pdf.setFillColor(...PLAYER_PDF_COLORS.bgLight);
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, 14, 2, 2, "FD");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
    pdf.text(toPdfSafeText(texts.noMatchesText), MARGIN_X + CONTENT_WIDTH / 2, y + 8.5, { align: "center" });
    return y + 18;
  }

  const columns = getMatchesTableColumns(summary, texts);
  const rowH = 6.2;

  if (y + 15 > MAX_CONTENT_Y) {
    pdf.addPage();
    y = 20;
  }

  y = drawMatchTableHeader(pdf, columns, y);

  matches.forEach((m, idx) => {
    if (y + rowH > MAX_CONTENT_Y) {
      pdf.addPage();
      y = 20;
      y = drawMatchTableHeader(pdf, columns, y);
    }

    pdf.setFillColor(...(idx % 2 === 0 ? PLAYER_PDF_COLORS.white : PLAYER_PDF_COLORS.bgLight));
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, rowH, "F");
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_WIDTH, y + rowH);

    const isDnp = m.played === false;
    const rawRes = String(m.result || "").toUpperCase();
    const resChar = rawRes === "W" ? texts.winChar : rawRes === "L" ? texts.lossChar : rawRes === "D" ? texts.drawChar : "";
    const resColor = rawRes === "W"
      ? PLAYER_PDF_COLORS.primary
      : rawRes === "L"
        ? PLAYER_PDF_COLORS.danger
        : rawRes === "D"
          ? PLAYER_PDF_COLORS.secondary
          : PLAYER_PDF_COLORS.textMuted;

    const homePrefix = m.isHome === false ? texts.awayTag : m.isHome === true ? texts.homeTag : "";
    const oppLabel = `${homePrefix ? `${homePrefix} ` : ""}${m.opponent || "-"}`;
    const scoreStr = m.score
      ? `${m.score}${resChar ? ` ${resChar}` : ""}`
      : (m.teamGoals !== undefined && m.oppGoals !== undefined
        ? `${m.teamGoals}-${m.oppGoals}${resChar ? ` ${resChar}` : ""}`
        : "-");
    const minStr = isDnp && !parseFinite(m.secondsPlayed, 0)
      ? texts.dnpLabel
      : (m.minutesPlayedFormatted || formatSecondsToClock(m.secondsPlayed || parseFinite(m.minutesPlayed, 0) * 60));

    const matchGoals = Math.round(parseFinite(m.goals, 0));
    const matchShots = Math.round(parseFinite(m.shotsCount, 0));
    const matchEff = m.efficiency !== undefined
      ? Math.round(parseFinite(m.efficiency, 0))
      : (matchShots > 0 ? Math.round((matchGoals / matchShots) * 100) : 0);
    const matchSaves = Math.round(parseFinite(m.saves, 0));
    const matchFaced = Math.round(parseFinite(m.shotsFaced, 0));
    const matchSavePct = m.savePct !== undefined
      ? Math.round(parseFinite(m.savePct, 0))
      : (matchFaced > 0 ? Math.round((matchSaves / matchFaced) * 100) : 0);
    const matchRatingNum = m.rating !== undefined && m.rating !== null ? parseFinite(m.rating, 7.0) : null;
    const ratingColor = matchRatingNum === null
      ? PLAYER_PDF_COLORS.textMuted
      : (matchRatingNum >= 7.5 ? PLAYER_PDF_COLORS.primary : matchRatingNum >= 5.5 ? PLAYER_PDF_COLORS.secondary : PLAYER_PDF_COLORS.danger);

    const rowValues = {
      date: formatShortDate(m.date),
      opponent: oppLabel,
      score: scoreStr,
      minutes: minStr,
      savesFaced: `${matchSaves}/${matchFaced}`,
      savePct: `${matchSavePct}%`,
      xSaves: parseFinite(m.goalkeeperXSaves, 0).toFixed(1),
      goalsShots: `${matchGoals}/${matchShots}`,
      eff: `${matchEff}%`,
      xg: parseFinite(m.xg, 0).toFixed(2),
      turnovers: String(Math.round(parseFinite(m.turnovers, 0))),
      sevenM: `${Math.round(parseFinite(m.drawn7mCount, 0))}/${Math.round(parseFinite(m.penaltiesCommitted, 0))}`,
      twoMins: String(Math.round(parseFinite(m.twoMins, 0))),
      rating: matchRatingNum !== null ? matchRatingNum.toFixed(1) : "-"
    };

    let x = MARGIN_X;
    columns.forEach((col) => {
      const valColor = col.key === "score"
        ? resColor
        : col.key === "rating"
          ? ratingColor
          : (col.key === "minutes" && isDnp ? PLAYER_PDF_COLORS.textMuted : PLAYER_PDF_COLORS.text);
      const isBold = col.key === "opponent" || col.key === "score" || col.key === "rating" || col.key === "goalsShots" || col.key === "savesFaced";
      drawMatchCellText(pdf, col, x, y + 4.3, rowValues[col.key] ?? "-", valColor, isBold);
      x += col.width;
    });

    y += rowH;
  });

  // Mantener filas TOTAL y PROMEDIO juntas
  const summaryRowsH = rowH * 2;
  if (y + summaryRowsH > MAX_CONTENT_Y) {
    pdf.addPage();
    y = 20;
    y = drawMatchTableHeader(pdf, columns, y);
  }

  const drawAggregateRow = (labelText, rowMap, bgColor, textColor) => {
    pdf.setFillColor(...bgColor);
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, rowH, "F");
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.25);
    pdf.line(MARGIN_X, y + rowH, MARGIN_X + CONTENT_WIDTH, y + rowH);

    // Ocupar columnas date + opponent para la etiqueta resumen
    const labelSpanW = columns[0].width + columns[1].width;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.1);
    pdf.setTextColor(...textColor);
    pdf.text(fitTextToWidth(pdf, labelText, labelSpanW - 4), MARGIN_X + 2, y + 4.3);

    let x = MARGIN_X + labelSpanW;
    for (let i = 2; i < columns.length; i += 1) {
      const col = columns[i];
      drawMatchCellText(pdf, col, x, y + 4.3, rowMap[col.key] ?? "-", textColor, true);
      x += col.width;
    }
    y += rowH;
  };

  const totalRowMap = isGoalkeeper
    ? {
        score: `${summary.wins}${texts.winChar}-${summary.draws}${texts.drawChar}-${summary.losses}${texts.lossChar}`,
        minutes: totals.minutesFormatted,
        savesFaced: `${totals.saves}/${totals.shotsFaced}`,
        savePct: `${totals.savePct}%`,
        xSaves: totals.goalkeeperXSaves.toFixed(1),
        goalsShots: `${totals.goals}/${totals.shotsCount}`,
        turnovers: String(totals.turnovers),
        twoMins: String(totals.twoMins),
        rating: averages.rating
      }
    : {
        score: `${summary.wins}${texts.winChar}-${summary.draws}${texts.drawChar}-${summary.losses}${texts.lossChar}`,
        minutes: totals.minutesFormatted,
        goalsShots: `${totals.goals}/${totals.shotsCount}`,
        eff: `${totals.efficiency}%`,
        xg: totals.xg.toFixed(2),
        turnovers: String(totals.turnovers),
        sevenM: `${totals.drawn7mCount}/${totals.penaltiesCommitted}`,
        twoMins: String(totals.twoMins),
        rating: averages.rating
      };

  const avgRowMap = isGoalkeeper
    ? {
        score: "-",
        minutes: averages.minutesFormatted,
        savesFaced: `${averages.saves}/${averages.shotsFaced}`,
        savePct: `${totals.savePct}%`,
        xSaves: averages.goalkeeperXSaves,
        goalsShots: `${averages.goals}/${averages.shotsCount}`,
        turnovers: averages.turnovers,
        twoMins: averages.twoMins,
        rating: averages.rating
      }
    : {
        score: "-",
        minutes: averages.minutesFormatted,
        goalsShots: `${averages.goals}/${averages.shotsCount}`,
        eff: `${totals.efficiency}%`,
        xg: averages.xg,
        turnovers: averages.turnovers,
        sevenM: `${averages.drawn7mCount}/${averages.penaltiesCommitted}`,
        twoMins: averages.twoMins,
        rating: averages.rating
      };

  drawAggregateRow(
    interpolate(texts.totalRowLabel, { count: matches.length }),
    totalRowMap,
    PLAYER_PDF_COLORS.bgAlt,
    PLAYER_PDF_COLORS.dark
  );
  drawAggregateRow(
    interpolate(texts.avgRowLabel, { count: summary.matchesPlayed }),
    avgRowMap,
    PLAYER_PDF_COLORS.primarySoft,
    PLAYER_PDF_COLORS.primary
  );

  return y + 6;
}

function applyPageChrome(pdf, summary, team, texts) {
  const totalPages = pdf.internal.getNumberOfPages();
  const runningText = interpolate(texts.runningHeader, {
    number: summary.number,
    name: summary.name,
    team: team?.name || "Handtix Club"
  });

  for (let i = 1; i <= totalPages; i += 1) {
    pdf.setPage(i);

    // Barra superior de color marca
    pdf.setFillColor(...PLAYER_PDF_COLORS.primary);
    pdf.rect(0, 0, PAGE_WIDTH, 3, "F");

    if (i > 1) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.6);
      pdf.setTextColor(...PLAYER_PDF_COLORS.primary);
      pdf.text(fitTextToWidth(pdf, runningText, CONTENT_WIDTH), MARGIN_X, 11);

      pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
      pdf.setLineWidth(0.3);
      pdf.line(MARGIN_X, 14, PAGE_WIDTH - MARGIN_X, 14);
    }

    // Pie de pagina en todas las paginas
    pdf.setDrawColor(...PLAYER_PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_X, 282, PAGE_WIDTH - MARGIN_X, 282);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PLAYER_PDF_COLORS.textMuted);
    pdf.text(toPdfSafeText(texts.footerLeft), MARGIN_X, 287);

    pdf.setFont("helvetica", "bold");
    pdf.text(
      toPdfSafeText(interpolate(texts.pageOf, { current: i, total: totalPages })),
      PAGE_WIDTH - MARGIN_X,
      287,
      { align: "right" }
    );
  }
}

/**
 * Genera el documento PDF individual de un jugador con totales, promedios y todos sus partidos.
 *
 * @param {object} player - Objeto del jugador (ej. salida de teamCumulativeEngine).
 * @param {object} [team] - Objeto del equipo ({ name, ... }).
 * @param {string} [lang="es"] - Idioma del informe ("es", "en", "de", "fr", "da", "pl").
 * @returns {jsPDF} Instancia de jsPDF lista para guardar o inspeccionar.
 */
export function generatePlayerReportPdf(player, team = {}, lang = "es") {
  const texts = getTexts(lang);
  const summary = computePlayerReportSummary(player);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  let y = drawCoverHeader(pdf, summary, team, texts);

  y = drawSectionHeading(pdf, texts.sectionSummary, y);
  y = drawKpiHighlightCards(pdf, summary, texts, y);
  y = drawSummaryComparisonTable(pdf, summary, texts, y);

  const hasTacticalData = summary.totals.shotsCount > 0 && (summary.shotPhases || summary.shotZones);
  if (hasTacticalData) {
    if (y + 62 > MAX_CONTENT_Y) {
      pdf.addPage();
      y = 20;
    }
    y = drawSectionHeading(pdf, texts.sectionTactics, y);
    y = drawShotBreakdownSection(pdf, summary, texts, y);
  }

  const matchesTitle = interpolate(
    hasTacticalData ? texts.sectionMatches : texts.sectionMatchesNoNum,
    { count: summary.matches.length }
  );
  if (y + 24 > MAX_CONTENT_Y) {
    pdf.addPage();
    y = 20;
  }
  y = drawSectionHeading(pdf, matchesTitle, y);
  drawMatchesLogTable(pdf, summary, texts, y);

  applyPageChrome(pdf, summary, team, texts);

  return pdf;
}

/**
 * Genera y descarga inmediatamente el informe PDF individual del jugador.
 */
export function downloadPlayerReportPdf(player, team = {}, lang = "es") {
  if (!player) {
    throw new Error("Player data is required to generate the individual report.");
  }
  const pdf = generatePlayerReportPdf(player, team, lang);
  const filename = sanitizeReportFilename(player.name, player.number);
  pdf.save(filename);
  return { success: true, filename };
}

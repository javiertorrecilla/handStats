/**
 * onboardingData.js
 * Contenido e internacionalización para el Tour Guiado Interactivo de Handtix Pro.
 * Soporta 6 idiomas: Español (es), English (en), Deutsch (de), Français (fr), Dansk (da), Polski (pl).
 */

export const tourTranslations = {
  es: {
    badge: "TOUR GUIADO",
    title: "Descubre Handtix Pro",
    stepOf: "Paso {{current}} de {{total}}",
    btnPrev: "Anterior",
    btnNext: "Siguiente",
    btnFinish: "¡Entendido, empezar!",
    btnSkip: "Saltar tour",
    btnOpenManual: "Ver Manual de Usuario",
    dontShowAgain: "No volver a mostrar automáticamente",
    proTipLabel: "CONSEJO PRO",
    steps: [
      {
        id: "welcome",
        category: "INTRODUCCIÓN",
        title: "Bienvenido a Handtix Pro",
        subtitle: "La suite de analítica y biomecánica en tiempo real para balonmano de élite.",
        description:
          "Handtix transforma la toma de decisiones en el banquillo. Diseñado como un instrumento táctico de alta precisión, te permite registrar partidos en vivo a pie de pista, extraer actas federativas oficiales al instante y consultar modelos predictivos de última generación.",
        highlights: [
          "Captura ergonómica de jugadas en menos de 3 segundos",
          "Modelos biomecánicos xG, xSaves y valoración neta NPS",
          "Dossieres tácticos en PDF listos para el cuerpo técnico",
          "Optimizado para tablets, portátiles y pantallas táctiles"
        ],
        proTip: "Puedes reiniciar este tour en cualquier momento desde el menú lateral o consultar el Manual de Usuario completo.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "GESTIÓN DE PARTIDOS",
        title: "Creación Rápida y Extracción de Actas PDF",
        subtitle: "Configura el partido manualmente o digitaliza el acta oficial de la RFEBM en 2 clics.",
        description:
          "Al preparar un encuentro puedes introducir rival, fecha, pabellón y tiempos de periodo. Además, gracias al motor de extracción inteligente, sube el acta PDF oficial de la federación y el sistema volcará de inmediato las plantillas completas, dorsales y cuerpo técnico sin errores manuales.",
        highlights: [
          "Extracción automática OCR/PDF de actas RFEBM y territoriales",
          "Configuración de periodos estándar (2x30 min, prórrogas, categorías base)",
          "Edición flexible de plantillas, dorsales y fotos de jugadores"
        ],
        proTip: "Si aún no dispones del acta federativa, crea el partido con dorsales genéricos y actualízalos más tarde.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "MESA DE CONTROL",
        title: "Mesa de Control en Directo: Flujo de 4 Toques",
        subtitle: "Registra cada evento a pie de pista sin perder el ritmo del partido.",
        description:
          "La mesa de control interactiva está optimizada para que un solo técnico registre el 100% de las acciones mediante una secuencia ergonómica guiada: 1️⃣ Selecciona el Jugador → 2️⃣ Elige la Acción → 3️⃣ Ubica la Zona de Pista → 4️⃣ Marca el Cuadrante de Portería 3x3.",
        highlights: [
          "Cronómetro oficial sincronizado con pausas y tiempos muertos",
          "Control automático de exclusiones de 2 min con alertas visuales de regreso",
          "Registro integral: Goles, paradas, 7m, faltas en ataque y pérdidas",
          "Gestión disciplinaria completa (amarillas, exclusiones, rojas y azules)"
        ],
        proTip: "En los 7 metros y faltas en ataque, puedes registrar tanto al jugador infractor como al que provocó la acción para una valoración justa.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "MODELOS AVANZADOS",
        title: "Modelos Biomecánicos: xG, xSaves y NPS",
        subtitle: "Métricas cuantitativas que van mucho más allá de un simple marcador.",
        description:
          "Supera la estadística tradicional con métricas validadas para balonmano moderno: Goles Esperados (xG) según ángulo y distancia, mérito de parada bajo palos (xSaves) y el Net Player Score (NPS), un algoritmo continuo que evalúa el impacto neto de cada jugador sobre el rendimiento del equipo.",
        highlights: [
          "xG dinámico: probabilidad matemática real de cada lanzamiento",
          "xSaves: premia al portero ante tiros difíciles y evalúa goles evitados",
          "NPS (-10 a +10): impacto neto ponderado en tiempo real",
          "Mapas de calor interactivos por zonas de pista y cuadrantes de marco"
        ],
        proTip: "Un tiro forzado desde 9m con bloqueador tiene un xG de ~0.22, mientras que un 6m de pivote o contraataque supera el 0.75.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "EQUIPOS Y PLANTILLAS",
        title: "Seguimiento Longitudinal y Scouting de Rivales",
        subtitle: "Histórico acumulado de temporada, mapas de lanzamiento y análisis individual.",
        description:
          "En la sección de Equipos podrás revisar las métricas acumuladas de tus jugadores a lo largo de los meses. Descubre qué extremos tienen mayor efectividad en lanzamientos con poco ángulo, la fiabilidad desde los 7 metros y cómo evoluciona la nota media de cada deportista.",
        highlights: [
          "Fichas individuales completas con posición táctica y dorsal",
          "Mapas de calor acumulados de la temporada para scouting de rivales",
          "Detección de patrones de lanzamiento (zonas favoritas y ángulos ciegos)",
          "Análisis de portería cruzado por tipo de tiro y lanzador"
        ],
        proTip: "Utiliza los mapas de calor de portería para planificar las hojas de tiro de tus porteros antes de jugar contra rivales clave.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "INFORMES & AJUSTES",
        title: "Dossier Táctico Oficial en PDF y Personalización",
        subtitle: "Exportación lista para imprimir, ajustes de parámetros y soporte multi-idioma.",
        description:
          "Genera con un clic informes tácticos en PDF de alta fidelidad, con desglose de efectividad por cuartos de hora, cronología de exclusiones y balance xG. Personaliza tu experiencia cambiando entre modo oscuro/claro y seleccionando entre los 6 idiomas disponibles.",
        highlights: [
          "Informes PDF oficiales diseñados para el cuerpo técnico",
          "Ajustes de calibración de métricas y ponderaciones",
          "Plataforma disponible en 6 idiomas (ES, EN, DE, FR, DA, PL)",
          "Cumplimiento total con RGPD, borrado de cuenta y privacidad de datos"
        ],
        proTip: "El dossier PDF es perfecto para compartir en WhatsApp o correo con los entrenadores asistentes y jugadores.",
        mockupType: "reports"
      }
    ]
  },
  en: {
    badge: "GUIDED TOUR",
    title: "Discover Handtix Pro",
    stepOf: "Step {{current}} of {{total}}",
    btnPrev: "Previous",
    btnNext: "Next",
    btnFinish: "Got it, let's start!",
    btnSkip: "Skip tour",
    btnOpenManual: "View User Manual",
    dontShowAgain: "Do not show automatically again",
    proTipLabel: "PRO TIP",
    steps: [
      {
        id: "welcome",
        category: "INTRODUCTION",
        title: "Welcome to Handtix Pro",
        subtitle: "The real-time analytics and biomechanics suite for elite handball.",
        description:
          "Handtix transforms bench decision-making. Engineered as a high-precision tactical tool, it empowers you to record live courtside matches, parse official federation match sheets instantly, and leverage next-gen predictive models.",
        highlights: [
          "Ergonomic 4-touch event logging in under 3 seconds",
          "Biomechanic models: xG, xSaves and Net Player Score (NPS)",
          "Professional PDF tactical dossiers ready for coaching staff",
          "Optimized for tablets, laptops, and touch screens"
        ],
        proTip: "You can restart this tour anytime from the sidebar or read the in-depth User Manual.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "MATCH MANAGEMENT",
        title: "Quick Setup & PDF Match Sheet Parsing",
        subtitle: "Configure matches manually or digitize official federation PDFs in 2 clicks.",
        description:
          "Set up opponent, date, arena, and period durations. Thanks to the smart PDF parser, upload the official match sheet and Handtix automatically imports complete rosters, shirt numbers, and team staff without tedious typing.",
        highlights: [
          "Automatic OCR/PDF parsing of official federation match sheets",
          "Standard period presets (2x30 min, extra time, youth categories)",
          "Flexible roster editing, player photos, and numbers"
        ],
        proTip: "If you don't have the official sheet yet, start with temporary numbers and edit players later.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "CONTROL DESK",
        title: "Live Control Desk: The 4-Touch Sequence",
        subtitle: "Log every courtside event seamlessly without missing game pace.",
        description:
          "The interactive live desk is built so a single analyst can record 100% of actions through a natural guided sequence: 1️⃣ Select Player → 2️⃣ Choose Action → 3️⃣ Tap Court Zone → 4️⃣ Click 3x3 Goal Quadrant.",
        highlights: [
          "Synchronized game clock with timeouts and pause management",
          "Automatic 2-minute suspension tracking with visual return timers",
          "Comprehensive logging: Goals, saves, 7m, offensive fouls, turnovers",
          "Full disciplinary tracking (yellows, 2-min penalties, red & blue cards)"
        ],
        proTip: "For 7-meter throws and offensive fouls, record both the committer and provoker for accurate player ratings.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "ADVANCED MODELS",
        title: "Biomechanical Models: xG, xSaves & NPS",
        subtitle: "Quantitative metrics far beyond standard box-score stats.",
        description:
          "Elevate your analysis with models tailored for modern handball: Expected Goals (xG) based on angle and distance, goalkeeper stop quality (xSaves), and Net Player Score (NPS), a continuous algorithm rating individual net impact.",
        highlights: [
          "Dynamic xG: Mathematical goal probability for every shot",
          "xSaves: Rates goalkeeper difficulty and goals prevented",
          "NPS (-10 to +10): Real-time weighted net contribution score",
          "Interactive court heatmaps and 3x3 goal quadrant distribution"
        ],
        proTip: "A contested 9m shot typically yields ~0.22 xG, whereas an uncontested 6m pivot or fast-break exceeds 0.75 xG.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "TEAMS & SQUADS",
        title: "Longitudinal Tracking & Opponent Scouting",
        subtitle: "Cumulative seasonal trends, shooting heatmaps, and player profiles.",
        description:
          "In the Teams section, explore cumulative player performance across the season. Discover which wingers excel from narrow angles, penalty shot reliability, and the progression of player ratings across matches.",
        highlights: [
          "Player profiles with tactical positions and jersey numbers",
          "Cumulative season heatmaps for thorough opponent scouting",
          "Detection of shooting patterns (preferred corners and blind spots)",
          "Cross-referenced goalkeeper analysis by shot location and shooter"
        ],
        proTip: "Use goal heatmaps to build targeted goalkeeper cheat sheets prior to facing key rivals.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "REPORTS & SETTINGS",
        title: "Official PDF Tactical Dossiers & Customization",
        subtitle: "One-click print-ready reports, parameter tuning, and multi-language support.",
        description:
          "Generate high-fidelity PDF match dossiers with quarter-by-quarter breakdowns, exclusion timelines, and xG balances. Tailor your Handtix experience with dark/light themes and 6 international languages.",
        highlights: [
          "High-resolution official PDF reports tailored for coaches",
          "Metric calibration and weight tuning settings",
          "6 supported languages (ES, EN, DE, FR, DA, PL)",
          "Full GDPR compliance, account erasure, and data privacy"
        ],
        proTip: "Exported PDFs are perfect for sharing with coaching staff, performance analysts, and players.",
        mockupType: "reports"
      }
    ]
  },
  de: {
    badge: "INTERAKTIVE TOUR",
    title: "Handtix Pro entdecken",
    stepOf: "Schritt {{current}} von {{total}}",
    btnPrev: "Zurück",
    btnNext: "Weiter",
    btnFinish: "Verstanden, los geht's!",
    btnSkip: "Tour überspringen",
    btnOpenManual: "Benutzerhandbuch öffnen",
    dontShowAgain: "Nicht mehr automatisch anzeigen",
    proTipLabel: "PROFI-TIPP",
    steps: [
      {
        id: "welcome",
        category: "EINFÜHRUNG",
        title: "Willkommen bei Handtix Pro",
        subtitle: "Die Echtzeit-Analyse- und Biomechanik-Suite für Spitzenhandball.",
        description:
          "Handtix revolutioniert taktische Entscheidungen auf der Trainerbank. Erfassen Sie Live-Spiele direkt am Spielfeldrand, lesen Sie offizielle Spielberichte blitzschnell ein und nutzen Sie modernste prädiktive Modelle.",
        highlights: [
          "Ergonomische 4-Touch-Erfassung in unter 3 Sekunden",
          "Biomechanische Modelle: xG, xSaves und Net Player Score (NPS)",
          "Professionelle PDF-Spielberichte für das Trainerteam",
          "Optimiert für Tablets, Laptops und Touchscreens"
        ],
        proTip: "Sie können diese Tour jederzeit über die Seitenleiste neu starten oder das Handbuch lesen.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "SPIELVERWALTUNG",
        title: "Schnelle Spielerstellung & PDF-Spielbericht",
        subtitle: "Manuelle Spieleinrichtung oder automatische PDF-Digitalisierung.",
        description:
          "Gegner, Datum, Spielort und Halbzeitlänge festlegen. Laden Sie das offizielle Verbands-PDF hoch – Handtix übernimmt automatisch den kompletten Kader, Rückennummern und Offizielle.",
        highlights: [
          "Automatische OCR/PDF-Erkennung offizieller Spielberichte",
          "Standard-Halbzeitprofile (2x30 Min., Verlängerung, Jugend)",
          "Flexible Kaderverwaltung und Spielernummern"
        ],
        proTip: "Falls noch kein Spielbericht vorliegt, können Sie mit vorläufigen Nummern starten.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "KONTROLLPULT",
        title: "Live-Schiedsgericht: 4-Touch-Erfassung",
        subtitle: "Jede Aktion am Spielfeldrand blitzschnell und fehlerfrei dokumentieren.",
        description:
          "1️⃣ Spieler wählen → 2️⃣ Aktion festlegen → 3️⃣ Feldposition antippen → 4️⃣ 3x3 Torsektor markieren. Schnell, präzise und übersichtlich.",
        highlights: [
          "Offizielle Spielzeituhr mit Auszeiten und Pausen",
          "Automatische 2-Minuten-Zeitstrafen mit visueller Rückkehruhr",
          "Tore, Paraden, 7m, Stürmerfouls und Ballverluste",
          "Vollständige Disziplinarstrafen (Gelb, 2 Min., Rot und Blau)"
        ],
        proTip: "Bei 7-Meter-Würfen und Stürmerfouls können Sie Foulenden und Gefoulten für eine faire Bewertung erfassen.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "ERWEITERTE MODELLE",
        title: "Biomechanik: xG, xSaves & NPS",
        subtitle: "Quantitative Kennzahlen weit über den Standard-Spielbericht hinaus.",
        description:
          "Expected Goals (xG) nach Distanz und Wurfwinkel, xSaves für Torhüterparaden und der Net Player Score (NPS) zur Echtzeit-Einschätzung des individuellen Spielerbeitrags.",
        highlights: [
          "Dynamisches xG: Reale Torwahrscheinlichkeit jedes Wurfs",
          "xSaves: Torhüterbewertung nach Schwierigkeit der Schüsse",
          "NPS (-10 bis +10): Gewichteter Nettoeinfluss im Spiel",
          "Interaktive Heatmaps und 3x3 Torquadranten"
        ],
        proTip: "Ein 9m-Rückraumwurf hat ca. 0,22 xG, ein freier Gegenstoß oder Kreisläuferwurf über 0,75 xG.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "TEAMS & KADER",
        title: "Saisonverlauf & Gegner-Scouting",
        subtitle: "Kumulierte Statistiken, Wurfmuster und Spielerprofile.",
        description:
          "Analysieren Sie Wurfquoten von Außen, 7-Meter-Sicherheit und die Entwicklung Ihrer Spieler über die gesamte Saison hinweg.",
        highlights: [
          "Spielerprofile mit Positionen und Trikotnummern",
          "Saisonweite Heatmaps für gezieltes Scouting",
          "Erkennung von Wurfmustern und Lieblingsecken",
          "Detaillierte Torhüter-Gegenüberstellung"
        ],
        proTip: "Nutzen Sie Tor-Heatmaps, um Ihre Torhüter vor wichtigen Spielen optimal auf Schützen vorzubereiten.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "BERICHTE & EINSTELLUNGEN",
        title: "Offizielle PDF-Dossiers & Personalisierung",
        subtitle: "Druckfertige Berichte, Parameter-Feinabstimmung und 6 Sprachen.",
        description:
          "Erstellen Sie mit einem Klick hochauflösende PDF-Berichte mit Viertelstunden-Trends, Zeitstrafen-Chronologie und xG-Verteilung. Verfügbar in Hell/Dunkel und 6 Sprachen.",
        highlights: [
          "Hochwertige PDF-Berichte für Trainerstab und Scouting",
          "Feinabstimmung der Metrik-Gewichtungen",
          "6 Sprachen (ES, EN, DE, FR, DA, PL)",
          "Vollständige DSGVO-Konformität und Kontolöschung"
        ],
        proTip: "Die exportierten PDFs lassen sich direkt per E-Mail oder Messenger mit dem Team teilen.",
        mockupType: "reports"
      }
    ]
  },
  fr: {
    badge: "TOUR GUIDÉ",
    title: "Découvrir Handtix Pro",
    stepOf: "Étape {{current}} sur {{total}}",
    btnPrev: "Précédent",
    btnNext: "Suivant",
    btnFinish: "Compris, c'est parti !",
    btnSkip: "Passer le tour",
    btnOpenManual: "Manuel d'utilisation",
    dontShowAgain: "Ne plus afficher automatiquement",
    proTipLabel: "CONSEIL PRO",
    steps: [
      {
        id: "welcome",
        category: "INTRODUCTION",
        title: "Bienvenue sur Handtix Pro",
        subtitle: "La suite d'analyse biomécanique en temps réel pour le handball d'élite.",
        description:
          "Handtix transforme la prise de décision sur le banc. Conçu comme un instrument de précision tactique, il permet d'enregistrer les matchs en direct, d'importer les feuilles de match officielles et d'exploiter des modèles prédictifs avancés.",
        highlights: [
          "Saisie ergonomique en 4 touches en moins de 3 secondes",
          "Modèles biomécaniques xG, xSaves et Net Player Score (NPS)",
          "Dossiers tactiques PDF haute fidélité pour le staff",
          "Optimisé pour tablettes, ordinateurs et écrans tactiles"
        ],
        proTip: "Vous pouvez relancer ce tour depuis la barre latérale ou lire le manuel d'utilisation complet.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "GESTION DE MATCH",
        title: "Création Rapide & Import PDF de Feuille de Match",
        subtitle: "Configurez manuellement ou numérisez l'acte officiel de fédération en 2 clics.",
        description:
          "Définissez adversaire, date, salle et durée des périodes. Grâce au parseur intelligent, téléversez le PDF officiel et Handtix importe instantanément les effectifs, numéros et officiels.",
        highlights: [
          "Extraction OCR/PDF automatique des feuilles officielles",
          "Profils de périodes standard (2x30 min, prolongations, jeunes)",
          "Édition facile des effectifs, numéros et photos"
        ],
        proTip: "Sans feuille officielle disponible, commencez avec des numéros génériques et modifiez-les plus tard.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "TABLE DE CONTRÔLE",
        title: "Table de Contrôle en Direct : Séquence 4 Touches",
        subtitle: "Enregistrez chaque action au bord du terrain sans perdre le fil du jeu.",
        description:
          "1️⃣ Choisir le Joueur → 2️⃣ Définir l'Action → 3️⃣ Pointer la Zone du Terrain → 4️⃣ Sélectionner le Quadrant 3x3 du But.",
        highlights: [
          "Chronomètre officiel synchronisé avec temps morts et pauses",
          "Suivi automatique des exclusions de 2 min avec compte à rebours",
          "Buts, arrêts, 7m, passages en force et pertes de balle",
          "Sanctions complètes (cartons jaunes, 2 min, rouges et bleus)"
        ],
        proTip: "Sur les jets de 7m et passages en force, enregistrez l'auteur et le provocateur pour une notation équitable.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "MODÈLES AVANCÉS",
        title: "Modèles Biomécaniques : xG, xSaves & NPS",
        subtitle: "Des métriques quantitatives bien au-delà de la feuille de match standard.",
        description:
          "Expected Goals (xG) selon l'angle et la distance, xSaves pour mesurer les arrêts décisifs du gardien, et Net Player Score (NPS) pour évaluer l'impact net continu de chaque joueur.",
        highlights: [
          "xG dynamique : probabilité mathématique réelle de chaque tir",
          "xSaves : récompense le gardien selon la difficulté du tir",
          "NPS (-10 à +10) : note d'impact net pondérée en direct",
          "Cartes thermiques interactives et quadrants de but 3x3"
        ],
        proTip: "Un tir de 9m contesté vaut ~0,22 xG, tandis qu'un tir de pivot ou contre-attaque à 6m dépasse 0,75 xG.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "ÉQUIPES & EFFECTIFS",
        title: "Suivi Longitudinal et Analyse des Adversaires",
        subtitle: "Historique cumulé de saison, cartes de tir et fiches individuelles.",
        description:
          "Explorez l'évolution de vos ailiers, la fiabilité sur penalty et la régularité de vos joueurs match après match.",
        highlights: [
          "Fiches de joueurs avec postes tactiques et numéros",
          "Cartes thermiques cumulées pour le scouting adverse",
          "Détection des zones de tir préférentielles",
          "Analyse croisée des gardiens par zone et tireur"
        ],
        proTip: "Utilisez les cartes thermiques pour préparer des fiches de tirs ciblées pour vos gardiens avant les matchs clés.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "RAPPORTS & PARAMÈTRES",
        title: "Dossiers Tactiques PDF Officiels & Personnalisation",
        subtitle: "Export imprimable en un clic, calibration des métriques et 6 langues.",
        description:
          "Générez des dossiers PDF professionnels avec évolution par quart d'heure, chronologie des exclusions et bilan xG. Disponible en mode sombre/clair et en 6 langues.",
        highlights: [
          "Rapports PDF haute résolution conçus pour les entraîneurs",
          "Ajustement des pondérations métriques",
          "6 langues disponibles (ES, EN, DE, FR, DA, PL)",
          "Conformité RGPD totale et suppression de compte sécurisée"
        ],
        proTip: "Le PDF exporté est idéal à partager par mail ou messagerie avec le staff technique.",
        mockupType: "reports"
      }
    ]
  },
  da: {
    badge: "GUIDET TUR",
    title: "Oplev Handtix Pro",
    stepOf: "Trin {{current}} af {{total}}",
    btnPrev: "Forrige",
    btnNext: "Næste",
    btnFinish: "Forstået, lad os starte!",
    btnSkip: "Spring over",
    btnOpenManual: "Åbn Brugermanual",
    dontShowAgain: "Vis ikke automatisk igen",
    proTipLabel: "PRO-TIP",
    steps: [
      {
        id: "welcome",
        category: "INTRODUKTION",
        title: "Velkommen til Handtix Pro",
        subtitle: "Realtids-analyse og biomekanik til elitehåndbold.",
        description:
          "Handtix styrker beslutningerne på bænken. Registrer kampe live ved banen, indlæs officielle kampprotokoller på et øjeblik og få adgang til avancerede forudsigelsesmodeller.",
        highlights: [
          "Ergonomisk 4-tryks registrering på under 3 sekunder",
          "Biomekaniske modeller: xG, xSaves og Net Player Score (NPS)",
          "Professionelle PDF-taktikrapporter til trænerteamet",
          "Optimeret til tablets, bærbare og touchskærme"
        ],
        proTip: "Du kan genstarte turen når som helst fra sidepanelet eller læse hele manualen.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "KAMPSTYRING",
        title: "Hurtig Oprettelse & PDF-Protokol Import",
        subtitle: "Opret kampe manuelt eller digitaliser forbundets officielle PDF i 2 klik.",
        description:
          "Indtast modstander, dato, hal og halvlegslængde. Med den smarte PDF-parser importeres hele truppen, trøjenumre og trænere automatisk.",
        highlights: [
          "Automatisk OCR/PDF-import af officielle kampskemaer",
          "Standard halvlegsprofiler (2x30 min, forlænget spilletid, ungdom)",
          "Fleksibel trupstyring og spillernumre"
        ],
        proTip: "Hvis du ikke har protokollen endnu, kan du starte med midlertidige numre og opdatere senere.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "KONTROLPULT",
        title: "Live Kontrolbord: 4-Trins Arbejdsgang",
        subtitle: "Registrer enhver hændelse ved banekanten uden at miste tempoet i kampen.",
        description:
          "1️⃣ Vælg Spiller → 2️⃣ Vælg Handling → 3️⃣ Angiv Baneposition → 4️⃣ Vælg 3x3 Målkvadrant.",
        highlights: [
          "Synkroniseret kampur med timeouts og pauser",
          "Automatisk sporing af 2-minutters udvisninger med retur-ur",
          "Mål, redninger, 7m, angrebsfejl og bolderobringer",
          "Komplet disciplinæroversigt (gult, 2 min, rødt og blåt kort)"
        ],
        proTip: "Ved straffekast og angrebsfejl kan du registrere både synder og provokatør for retfærdig vurdering.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "AVANCEREDE MODELLER",
        title: "Biomekanik: xG, xSaves & NPS",
        subtitle: "Kvantitative målinger langt ud over standard statistik.",
        description:
          "Expected Goals (xG) baseret på vinkel og afstand, xSaves til måling af målvogterens redningskvalitet og Net Player Score (NPS) til løbende vurdering af spillerens nettobidrag.",
        highlights: [
          "Dynamisk xG: Matematisk scoringssandsynlighed for hvert skud",
          "xSaves: Belønner målvogteren for vanskelige redninger",
          "NPS (-10 til +10): Vægtet nettoeffekt i realtid",
          "Interaktive heatmaps og 3x3 målszoner"
        ],
        proTip: "Et presset 9m-skud giver ca. 0,22 xG, mens en fri kontrafase eller stregaktion overstiger 0,75 xG.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "HOLD & TRUP",
        title: "Sæsonhistorik & Modstander-Scouting",
        subtitle: "Akkumulerede statistikker, skudmønstre og individuelle profiler.",
        description:
          "Se udviklingen i fløjspillernes effektivitet, straffekastsikkerhed og spillernes karakterer gennem hele sæsonen.",
        highlights: [
          "Spillerprofiler med taktiske positioner og trøjenumre",
          "Sæsondækkende heatmaps til modstanderscouting",
          "Kortlægning af favorit-skudvinkler og blinde vinkler",
          "Målvogteranalyse krydset med skudposition og skytte"
        ],
        proTip: "Brug målets heatmaps til at udarbejde skudsedler til dine målvogtere før nøglekampe.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "RAPPORTER & INDSTILLINGER",
        title: "Officielle PDF-Dossierer & Tilpasning",
        subtitle: "Klare udskrifter med et klik, parameterkalibrering og 6 sprog.",
        description:
          "Generer professionelle PDF-kamprapporter med 15-minutters tendenser, udvisningskronologi og xG-oversigt. Fås i mørk/lys tilstand og 6 sprog.",
        highlights: [
          "Højopløselige PDF-rapporter skræddersyet til trænere",
          "Finjustering af metriske vægtninger",
          "6 understøttede sprog (ES, EN, DE, FR, DA, PL)",
          "Fuld GDPR-overensstemmelse og sletning af konto"
        ],
        proTip: "De eksporterede PDF-filer er perfekte til at dele med trænerstaben på mail eller besked.",
        mockupType: "reports"
      }
    ]
  },
  pl: {
    badge: "PRZEWODNIK",
    title: "Poznaj Handtix Pro",
    stepOf: "Krok {{current}} z {{total}}",
    btnPrev: "Wstecz",
    btnNext: "Dalej",
    btnFinish: "Zrozumiałem, zaczynamy!",
    btnSkip: "Pomiń samouczek",
    btnOpenManual: "Podręcznik Użytkownika",
    dontShowAgain: "Nie pokazuj ponownie automatycznie",
    proTipLabel: "WSKAZÓWKA PRO",
    steps: [
      {
        id: "welcome",
        category: "WPROWADZENIE",
        title: "Witaj w Handtix Pro",
        subtitle: "Pakiet analityki w czasie rzeczywistym i biomechaniki dla piłki ręcznej.",
        description:
          "Handtix rewolucjonizuje podejmowanie decyzji na ławce trenerskiej. Rejestruj mecze na żywo przy linii boiska, błyskawicznie importuj oficjalne protokoły meczowe i korzystaj z zaawansowanych modeli predykcyjnych.",
        highlights: [
          "Ergonomiczna rejestracja w 4 dotknięciach w poniżej 3 sekundy",
          "Modele biomechaniczne xG, xSaves oraz ocena Net Player Score (NPS)",
          "Oficjalne raporty taktyczne PDF dla sztabu szkoleniowego",
          "Zoptymalizowane pod tablety, laptopy i ekrany dotykowe"
        ],
        proTip: "Możesz zrestartować ten samouczek w dowolnym momencie z menu bocznego lub przeczytać podręcznik.",
        mockupType: "welcome"
      },
      {
        id: "match-setup",
        category: "ZARZĄDZANIE MECZEM",
        title: "Szybkie Tworzenie & Import Protokołu PDF",
        subtitle: "Skonfiguruj mecz ręcznie lub zdigitalizuj oficjalny protokół w 2 kliknięciach.",
        description:
          "Wprowadź rywala, datę, halę i czas trwania połów. Dzięki inteligentnemu czytnikowi PDF prześlij oficjalny protokół związkowy, a Handtix zaimportuje pełne składy, numery i sztab.",
        highlights: [
          "Automatyczny odczyt OCR/PDF oficjalnych protokołów meczowych",
          "Standardowe profile czasowe (2x30 min, dogrywki, grupy młodzieżowe)",
          "Wygodna edycja składów, numerów i zdjęć zawodników"
        ],
        proTip: "Jeśli nie masz jeszcze protokołu, zacznij z numerami tymczasowymi i zaktualizuj je później.",
        mockupType: "match_setup"
      },
      {
        id: "live-desk",
        category: "STOLIK SĘDZIOWSKI",
        title: "Stolik na Żywo: Przepływ 4 Dotknięć",
        subtitle: "Zapisuj każde zdarzenie przy linii bocznej bez gubienia tempa meczu.",
        description:
          "1️⃣ Wybierz Zawodnika → 2️⃣ Określ Akcję → 3️⃣ Zaznacz Strefę Boiska → 4️⃣ Wskaż Sektor Bramki 3x3.",
        highlights: [
          "Zsynchronizowany zegar meczowy z przerwami na żądanie",
          "Automatyczne odliczanie kar 2 minut z wizualnym alertem powrotu",
          "Bramki, obrony bramkarza, karne 7m, faule w ataku i straty",
          "Pełna ewidencja dyscyplinarna (żółte kartki, 2 minuty, czerwone i niebieskie)"
        ],
        proTip: "Przy rzutach karnych i faulach w ataku możesz przypisać zarówno faulującego, jak i wymuszającego.",
        mockupType: "live_desk"
      },
      {
        id: "analytics-xg",
        category: "ZAAWANSOWANE MODELE",
        title: "Biomechanika: xG, xSaves & NPS",
        subtitle: "Ilościowe wskaźniki daleko wykraczające poza zwykły protokół meczowy.",
        description:
          "Gole Oczekiwane (xG) na podstawie odległości i kąta, xSaves oceniające kunszt bramkarza oraz Net Player Score (NPS) mierzący wpływ netto zawodnika na grę.",
        highlights: [
          "Dynamiczne xG: Matematyczne prawdopodobieństwo bramki z każdego rzutu",
          "xSaves: Premia dla bramkarza za obronę trudnych rzutów",
          "NPS (-10 do +10): Bieżąca ważona ocena wkładu w wynik drużyny",
          "Interaktywne mapy ciepła i rozkład rzutów w siatce 3x3 bramki"
        ],
        proTip: "Rzut z 9m z blokiem ma ok. 0.22 xG, podczas gdy czysta sytuacja ze skrzydła lub koła przekracza 0.75 xG.",
        mockupType: "analytics"
      },
      {
        id: "teams-roster",
        category: "DRUŻYNY & KADRA",
        title: "Śledzenie Sezonowe & Scouting Rywali",
        subtitle: "Zagregowane statystyki, mapy rzutowe i profile zawodników.",
        description:
          "Badaj skuteczność skrzydeł, pewność egzekwowania rzutów karnych oraz ewolucję ocen zawodników na przestrzeni całego sezonu.",
        highlights: [
          "Profile zawodników z pozycjami taktycznymi i numerami",
          "Mapy ciepła z całego sezonu do profesjonalnego scoutingu",
          "Wykrywanie ulubionych stref rzutowych i martwych punktów",
          "Krzyżowa analiza bramkarzy według stref i rzucających"
        ],
        proTip: "Użyj map ciepła bramki, aby przygotować ściągawki dla bramkarzy przed kluczowymi meczami.",
        mockupType: "teams"
      },
      {
        id: "reports-settings",
        category: "RAPORTY & USTAWIENIA",
        title: "Oficjalne Raporty PDF & Personalizacja",
        subtitle: "Gotowe do druku zestawienia, kalibracja parametrów i 6 języków.",
        description:
          "Generuj jednym kliknięciem profesjonalne raporty PDF z trendami kwadransowymi, osią czasu wykluczeń i bilansem xG. Dostępne w trybie jasnym/ciemnym i 6 językach.",
        highlights: [
          "Wysokiej rozdzielczości raporty PDF dla sztabu trenerskiego",
          "Dostrajanie wag i parametrów algorytmów",
          "6 dostępnych języków (ES, EN, DE, FR, DA, PL)",
          "Pełna zgodność z RODO i bezpieczne usuwanie konta"
        ],
        proTip: "Wygenerowany plik PDF można łatwo wysłać e-mailem lub komunikatorem do współpracowników.",
        mockupType: "reports"
      }
    ]
  }
};

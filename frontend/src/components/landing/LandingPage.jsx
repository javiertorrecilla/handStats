import { useState, useEffect, useRef } from "react";
import logoHorizontal from "../../assets/logoHorizontal.png";
import "./LandingPage.css";

/* ==========================================================
   INLINE SVG ICONS
   ========================================================== */

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrendingUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconLaptop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="1" y1="20" x2="23" y2="20" />
  </svg>
);

const IconTablet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

/* ==========================================================
   DATA
   ========================================================== */

const MARQUEE_ITEMS_1 = [
  "Análisis en Directo", "Modelos xG & xSaves", "Mapas de Calor 3D",
  "Valoración 0-10", "Exportación PDF", "Rendimiento Defensivo",
  "Gestión de Plantillas", "Campograma Interactivo", "Handball Pro Analytics"
];

const MARQUEE_ITEMS_2 = [
  "Analyze", "Improve", "Win", "Analyze", "Improve", "Win", "Analyze", "Improve", "Win"
];

const STATS_DATA = [
  { value: 8, suffix: "+", label: "Módulos Estadísticos Pro" },
  { value: 96, suffix: "%", label: "Precisión Algorítmica xG" },
  { value: 500, suffix: "+", label: "Partidos Procesados" },
  { value: 100, suffix: "%", label: "Disponibilidad Cloud 24/7" },
];

const PRODUCT_TABS = [
  {
    id: "dashboard",
    label: "Dashboard General",
    tag: "Panel Central",
    title: "Visión Global del Partido en Tiempo Real",
    desc: "Consulta el marcador dinámico, posesión, efectividad por fases y tendencias de ataque/defensa en un panel interactivo diseñado para la toma rápida de decisiones.",
    checks: [
      "Control de posesiones y ritmo de partido",
      "Evolución del marcador y rachas goleadoras",
      "Eficiencia de lanzamientos en tiempo real"
    ],
    image: "/dashboard-mockup.jpg"
  },
  {
    id: "shots",
    label: "Campograma & xG",
    tag: "Táctico",
    title: "Mapas de Lanzamiento y Expected Goals (xG)",
    desc: "Registra el punto exacto de tiro y la zona de portería. Visualiza mapas de calor dinámicos y la calidad esperada de cada ocasión generada.",
    checks: [
      "Campograma con filtrado por posición y jugador",
      "Cálculo de probabilidad de gol (xG) individualizado",
      "Identificación de zonas débiles del rival"
    ],
    image: "/laptop-mockup.jpg"
  },
  {
    id: "players",
    label: "Jugadores & Ratings",
    tag: "Rendimiento",
    title: "Valoración Científica 0.0 - 10.0 por Jugador",
    desc: "Algoritmo ponderado que premia goles decisivos, paradas, asistencias, recuperaciones y penaliza pérdidas y exclusiones con rigor profesional.",
    checks: [
      "Tabla clasificada de rendimiento por minutos",
      "Seguimiento acumulado a lo largo de la temporada",
      "Informes individuales listos para el cuerpo técnico"
    ],
    image: "/tablet-mockup.jpg"
  },
  {
    id: "reports",
    label: "Informes PDF",
    tag: "Exportación",
    title: "Reportes Profesionales Descargables al Instante",
    desc: "Genera dossiers técnicos completos en PDF con mapas de calor, gráficos circulares y tablas de rendimiento para entregar a jugadores o directiva.",
    checks: [
      "Exportación en alta resolución lista para imprimir",
      "Personalizado con escudos y nombres de los equipos",
      "Compatible con cualquier dispositivo y proyector"
    ],
    image: "/dashboard-mockup.jpg"
  }
];

const DEVICE_DETAILS = {
  desktop: {
    badge: "Escritorio / Portátil",
    title: "Suite de Análisis Táctico en Pantalla Completa",
    desc: "Diseñado para analistas, entrenadores principales y sesiones de vídeo post-partido con un entorno multiventana de máxima productividad.",
    points: [
      { bold: "Visualización Multivariable:", text: "Campograma interactivo, cronología al segundo y tabla de valoraciones en una sola vista panorámica." },
      { bold: "Informes y Exportación Inmediata:", text: "Generación de dossiers completos en PDF listos para imprimir o proyectar en el vestuario." },
      { bold: "Comparativa Histórica:", text: "Filtros acumulados de temporada para estudiar tendencias del equipo y rivales." }
    ],
    image: "/laptop-mockup.jpg"
  },
  tablet: {
    badge: "Tablet / Banquillo",
    title: "Toma de Datos Táctil a Pie de Pista",
    desc: "Optimizada para registrar cada acción del partido en directo desde el banquillo sin apartar la mirada del juego ni un segundo.",
    points: [
      { bold: "Registro Ultra Rápido en 2 Toques:", text: "Toca el punto de lanzamiento en pista y el cuadrante de portería con respuesta instantánea." },
      { bold: "Control Táctil de Posesiones:", text: "Cambio de posesión, exclusiones y tiempos muertos con botones ergonómicos de gran tamaño." },
      { bold: "Sincronización Cloud Automática:", text: "Tus datos se transmiten en tiempo real para que el cuerpo técnico los consulte al instante." }
    ],
    image: "/tablet-mockup.jpg"
  }
};

const FEATURES_LIST = [
  {
    icon: <IconZap />,
    title: "Toma de Datos Instantánea",
    desc: "Campograma táctico ágil con registro en dos toques para lanzamientos, 7 metros, sanciones disciplinarias y tiempos muertos."
  },
  {
    icon: <IconBarChart />,
    title: "Métricas Avanzadas (xG / xSaves)",
    desc: "Algoritmos matemáticos adaptados específicamente a la biomecánica y distancias del balonmano moderno."
  },
  {
    icon: <IconFlame />,
    title: "Mapas de Calor Interactivos",
    desc: "Visualización térmica de las zonas de mayor peligro ofensivo y sectores vulnerables en la defensa rival."
  },
  {
    icon: <IconShield />,
    title: "Eficiencia Defensiva & Portería",
    desc: "Mapas de portería 3x2 divididos en 9 cuadrantes para estudiar los patrones de parada de tus guardametas."
  },
  {
    icon: <IconUsers />,
    title: "Gestión de Equipos y Jugadores",
    desc: "Crea tu plantilla, guarda formaciones habituales y lleva un histórico del crecimiento deportivo de cada atleta."
  },
  {
    icon: <IconFileText />,
    title: "Exportación & Dossiers Técnicos",
    desc: "Comparte informes completos post-partido con un solo clic en formato PDF profesional de alto impacto visual."
  }
];

const HOW_STEPS = [
  {
    num: "01",
    title: "Configura el Encuentro",
    desc: "Introduce equipos, plantillas y dorsales en menos de 60 segundos con nuestra interfaz optimizada."
  },
  {
    num: "02",
    title: "Registra en Directo",
    desc: "Anota goles, paradas, faltas y pérdidas en el campograma táctico durante el partido o en diferido."
  },
  {
    num: "03",
    title: "Analiza y Gana",
    desc: "Accede de inmediato a valoraciones, mapas de calor y conclusiones estadísticas para preparar el siguiente reto."
  }
];

const TESTIMONIALS_DATA = [
  {
    quote: "HandStats nos ha permitido detectar patrones de tiro del rival que antes pasaban desapercibidos. La claridad de los mapas de calor es insuperable.",
    name: "Carlos Mendoza",
    role: "Entrenador — División de Honor",
    initials: "CM"
  },
  {
    quote: "El sistema de valoración de jugadores y el modelo xG aporta un nivel de rigor que motiva a toda la plantilla a mejorar en cada entrenamiento.",
    name: "Laura Vázquez",
    role: "Analista Táctica Profesional",
    initials: "LV"
  },
  {
    quote: "Poder exportar el informe PDF justo al terminar el partido y compartirlo con el cuerpo técnico nos ahorra horas de trabajo cada semana.",
    name: "Miguel Ángel Torres",
    role: "Director Deportivo",
    initials: "MT"
  }
];

/* ==========================================================
   HOOKS
   ========================================================== */

function useCountUp(target, duration = 2000, isVisible = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return count;
}

function StatCounterCard({ value, suffix, label }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const count = useCountUp(value, 1800, isVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return (
    <div ref={ref} className="stat-counter-box">
      <div className="stat-num-val">
        {count}
        <span className="stat-num-suffix">{suffix}</span>
      </div>
      <div className="stat-num-label">{label}</div>
    </div>
  );
}

/* ==========================================================
   MAIN COMPONENT
   ========================================================== */

export default function LandingPage({ onTryApp, theme = "dark", toggleTheme }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState("dashboard");
  const [selectedDevice, setSelectedDevice] = useState("desktop"); // "desktop" | "tablet"

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTry = () => {
    if (onTryApp) onTryApp();
  };

  const currentTab = PRODUCT_TABS.find(t => t.id === activeTabId) || PRODUCT_TABS[0];
  const activeDeviceData = DEVICE_DETAILS[selectedDevice] || DEVICE_DETAILS.desktop;

  return (
    <div className="landing-page">
      {/* ======== 1. NAVBAR ======== */}
      <header className={`landing-nav-wrapper ${navScrolled ? "scrolled" : ""}`}>
        <div className="landing-nav-bar">
          <a href="#hero" className="landing-nav-brand" onClick={(e) => { e.preventDefault(); scrollTo("hero"); }}>
            <img src={logoHorizontal} alt="HandStats — Analyze. Improve. Win." />
          </a>

          <nav className="landing-nav-menu">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Funciones</a>
            <a href="#product" onClick={(e) => { e.preventDefault(); scrollTo("product"); }}>Producto</a>
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>Cómo Funciona</a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollTo("testimonials"); }}>Opiniones</a>
          </nav>

          <div className="landing-nav-actions">
            {toggleTheme && (
              <button 
                type="button"
                className="btn-theme-toggle-lp"
                onClick={toggleTheme}
                title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
                aria-label="Cambiar tema de color"
              >
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
            )}

            <button className="btn-nav-try" onClick={handleTry}>
              <span>Probar HandStats</span>
              <IconArrowRight />
            </button>

            <button 
              className="landing-nav-toggle" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`landing-nav-mobile ${mobileMenuOpen ? "open" : ""}`}>
        <button 
          className="landing-nav-mobile-close" 
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          <IconX />
        </button>

        <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>Funciones</a>
        <a href="#product" onClick={(e) => { e.preventDefault(); scrollTo("product"); }}>Producto</a>
        <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>Cómo Funciona</a>
        <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollTo("testimonials"); }}>Opiniones</a>
        
        {toggleTheme && (
          <button 
            type="button"
            className="btn-hero-secondary"
            onClick={toggleTheme}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
            <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>
        )}

        <button className="btn-hero-primary" onClick={handleTry} style={{ width: "100%", justifyContent: "center" }}>
          <span>Probar HandStats Ahora</span>
          <IconArrowRight />
        </button>
      </div>

      {/* ======== 2. HERO WITH FREE-MOVING STATS & 3D HANDBALLS ======== */}
      <section className="landing-hero" id="hero">
        <div className="hero-glow-orb-1" />
        <div className="hero-glow-orb-2" />
        <div className="hero-court-grid" />

        {/* 3D Floating & Spinning Handball Spheres drifting freely */}
        <div className="hero-3d-ball-wrap hero-3d-ball-1">
          <div className="handball-3d-sphere" />
        </div>
        <div className="hero-3d-ball-wrap hero-3d-ball-2">
          <div className="handball-3d-sphere" />
        </div>
        <div className="hero-3d-ball-wrap hero-3d-ball-3">
          <div className="handball-3d-sphere" />
        </div>
        <div className="hero-3d-ball-wrap hero-3d-ball-4">
          <div className="handball-3d-sphere" />
        </div>

        {/* Floating Animated Stat Elements Drifting Freely in Hero */}
        <div className="hero-floating-elements-layer">
          {/* Card 1: Donut Efficiency */}
          <div className="hero-stat-card hero-card-donut">
            <div className="donut-card-inner">
              <div className="donut-svg-wrap">
                <svg width="50" height="50" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(18, 132, 58, 0.15)"
                    strokeWidth="3.8"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2dbe60"
                    strokeWidth="3.8"
                    strokeDasharray="78, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="donut-center-text">78%</div>
              </div>
              <div>
                <div className="stat-card-title">Efectividad de Tiro</div>
                <div className="stat-card-val-big">28 / 36 Goles</div>
                <span className="stat-card-badge-pill">+14% vs rival</span>
              </div>
            </div>
          </div>

          {/* Card 2: xG Expected Goals */}
          <div className="hero-stat-card hero-card-xg">
            <div className="stat-card-title">Expected Goals (xG)</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="stat-card-val-big" style={{ color: "#2dbe60" }}>8.4 xG</div>
              <span className="stat-card-badge-pill">Alta Calidad</span>
            </div>
            <div className="xg-card-bars">
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "45%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "70%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "90%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "60%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "85%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "100%" }} /></div>
            </div>
          </div>

          {/* Card 3: Shot Map / Court */}
          <div className="hero-stat-card hero-card-court">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="stat-card-title">Zonas de Peligro</div>
              <span className="stat-card-badge-pill">6 Metros</span>
            </div>
            <div className="court-mini-visual">
              <div className="court-arc-mini" />
              <div className="court-hit-point" style={{ top: "35%", left: "25%" }} />
              <div className="court-hit-point" style={{ top: "45%", left: "48%", background: "#2dbe60" }} />
              <div className="court-hit-point" style={{ top: "30%", left: "70%" }} />
              <div className="court-hit-point" style={{ top: "50%", left: "80%" }} />
            </div>
          </div>

          {/* Card 4: Player MVP Rating */}
          <div className="hero-stat-card hero-card-player">
            <div className="stat-card-title">MVP del Partido</div>
            <div className="player-card-flex">
              <div>
                <div className="stat-card-val-big" style={{ fontSize: "1.02rem" }}>M. Andersson</div>
                <div style={{ fontSize: "0.76rem", color: "var(--lp-text-muted)" }}>7 Goles · 4 Asist.</div>
              </div>
              <div className="player-rating-badge">9.2</div>
            </div>
          </div>

          {/* Card 5: Goalkeeper Saves % (NEW) */}
          <div className="hero-stat-card hero-card-gk">
            <div className="stat-card-title">
              <IconShield />
              <span>Portería</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="stat-card-val-big" style={{ color: "#2dbe60" }}>42% Paradas</div>
              <span className="stat-card-badge-pill">14 Salvadas</span>
            </div>
          </div>

          {/* Card 6: Live Possession (NEW) */}
          <div className="hero-stat-card hero-card-possession">
            <div className="stat-card-title">
              <span className="live-pulse-dot" />
              <span>En Directo · 48:15</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>Posesión</span>
              <span style={{ fontWeight: 800, color: "#2dbe60", fontSize: "0.95rem" }}>56% - 44%</span>
            </div>
          </div>

          {/* Card 7: Fastbreak Transition (NEW) */}
          <div className="hero-stat-card hero-card-fastbreak">
            <div className="stat-card-title">
              <IconZap />
              <span>Contraataques</span>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>+6 Goles en Transición</div>
          </div>

          {/* Card 8: 7m Penalty Efficiency (NEW) */}
          <div className="hero-stat-card hero-card-7m">
            <div className="stat-card-title">
              <IconTarget />
              <span>Penaltis 7m</span>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#2dbe60" }}>5 / 5 (100% Éxito)</div>
          </div>
        </div>

        {/* Central Hero Content */}
        <div className="hero-content-center">
          <div className="landing-badge">
            <IconActivity />
            <span>Plataforma Profesional de Balonmano</span>
          </div>

          <h1 className="hero-main-title">
            Lleva tu equipo al<br />
            <span className="hero-title-highlight">siguiente nivel</span>
          </h1>

          <p className="hero-desc">
            Analítica táctica en tiempo real, modelos matemáticos xG, mapas de calor interactivos y valoraciones de jugadores. Todo en una sola plataforma profesional.
          </p>

          <div className="hero-buttons-row">
            <button className="btn-hero-primary" onClick={handleTry}>
              <span>Probar HandStats Gratis</span>
              <IconArrowRight />
            </button>

            <button className="btn-hero-secondary" onClick={() => scrollTo("product")}>
              <IconBarChart />
              <span>Ver Demostración</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======== 3. MARQUEE BARS ======== */}
      <div className="landing-marquee">
        <div className="marquee-content">
          {[...MARQUEE_ITEMS_1, ...MARQUEE_ITEMS_1].map((item, i) => (
            <div key={i} className="marquee-item">
              <span>{item}</span>
              <span className="marquee-dot">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* ======== 4. STATS COUNTER ROW ======== */}
      <section className="landing-stats-row">
        <div className="landing-container">
          <div className="stats-grid-4">
            {STATS_DATA.map((s, i) => (
              <StatCounterCard key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      <div className="landing-marquee green-accent reverse">
        <div className="marquee-content">
          {[...MARQUEE_ITEMS_2, ...MARQUEE_ITEMS_2].map((item, i) => (
            <div key={i} className="marquee-item">
              <span>{item}</span>
              <span className="marquee-dot">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* ======== 5. PRODUCT SHOWCASE ======== */}
      <section className="landing-product-section" id="product">
        <div className="landing-container">
          <div className="center-header">
            <div className="landing-badge">
              <IconBarChart />
              <span>Producto & Visualizaciones</span>
            </div>
            <h2 className="landing-title">Una suite analítica diseñada para ganar</h2>
            <p className="landing-subtitle">
              Explora las herramientas que utilizan entrenadores y analistas tácticos para transformar datos en victorias.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="product-tabs-nav">
            {PRODUCT_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`btn-product-tab ${activeTabId === tab.id ? "active" : ""}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.id === "dashboard" && <IconBarChart />}
                {tab.id === "shots" && <IconTarget />}
                {tab.id === "players" && <IconUsers />}
                {tab.id === "reports" && <IconFileText />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Browser Showcase Mockup */}
          <div className="product-showcase-frame">
            <div className="product-frame-topbar">
              <div className="browser-dots">
                <span className="b-dot red" />
                <span className="b-dot yellow" />
                <span className="b-dot green" />
              </div>
              <div className="browser-url-pill">
                <IconLock />
                <span>handstats.app/analytics/{activeTabId}</span>
              </div>
              <div style={{ width: 48 }} />
            </div>

            <div className="product-frame-body">
              <div className="product-visual-slot">
                <img 
                  src={currentTab.image} 
                  alt={currentTab.title}
                  loading="lazy"
                />
              </div>

              <div className="product-info-column">
                <span className="product-feature-tag">{currentTab.tag}</span>
                <h3 className="product-info-title">{currentTab.title}</h3>
                <p className="product-info-desc">{currentTab.desc}</p>
                <ul className="product-checklist">
                  {currentTab.checks.map((check, i) => (
                    <li key={i}>
                      <span className="product-check-icon"><IconCheck /></span>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ---- DEDICATED DEVICE SELECTOR SUB-SECTION ---- */}
          <div className="device-selector-section">
            <div className="device-selector-header">
              <h3 className="device-selector-title">Elige tu dispositivo de trabajo</h3>
              <p className="device-selector-subtitle">Adaptado a la perfección tanto para el trabajo táctico en despacho como para el banquillo en directo.</p>
            </div>

            {/* Toggle Buttons: Desktop/Laptop vs Tablet */}
            <div className="device-buttons-group">
              <button
                type="button"
                className={`btn-device-toggle ${selectedDevice === "desktop" ? "active" : ""}`}
                onClick={() => setSelectedDevice("desktop")}
              >
                <IconLaptop />
                <span>Versión Escritorio / Portátil</span>
              </button>

              <button
                type="button"
                className={`btn-device-toggle ${selectedDevice === "tablet" ? "active" : ""}`}
                onClick={() => setSelectedDevice("tablet")}
              >
                <IconTablet />
                <span>Versión Tablet</span>
              </button>
            </div>

            {/* Active Device Showcase Panel */}
            <div className="device-active-display-box" key={selectedDevice}>
              <div className="device-mockup-wrapper">
                <img 
                  src={activeDeviceData.image} 
                  alt={activeDeviceData.title}
                  loading="lazy"
                />
              </div>

              <div className="device-details-column">
                <span className="device-badge-tag">{activeDeviceData.badge}</span>
                <h4 className="device-title-text">{activeDeviceData.title}</h4>
                <p className="device-desc-text">{activeDeviceData.desc}</p>

                <ul className="device-points-list">
                  {activeDeviceData.points.map((p, i) => (
                    <li key={i}>
                      <span className="product-check-icon"><IconCheck /></span>
                      <div>
                        <strong>{p.bold}</strong> {p.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== 6. FEATURES GRID ======== */}
      <section className="landing-features-section" id="features">
        <div className="landing-container">
          <div className="center-header">
            <div className="landing-badge">
              <IconZap />
              <span>Funcionalidades Clave</span>
            </div>
            <h2 className="landing-title">Todo lo que tu equipo necesita</h2>
            <p className="landing-subtitle">
              Diseñado mano a mano con profesionales del balonmano para cubrir cada fase del partido.
            </p>
          </div>

          <div className="features-grid-3">
            {FEATURES_LIST.map((feat, i) => (
              <div key={i} className="feature-box-3d">
                <div className="feature-icon-bubble">{feat.icon}</div>
                <h3 className="feature-title-text">{feat.title}</h3>
                <p className="feature-desc-text">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 7. HOW IT WORKS ======== */}
      <section className="landing-how-section" id="how">
        <div className="landing-container">
          <div className="center-header">
            <div className="landing-badge">
              <IconTrendingUp />
              <span>Flujo de Trabajo</span>
            </div>
            <h2 className="landing-title">En 3 sencillos pasos</h2>
            <p className="landing-subtitle">
              Sin configuraciones complejas ni curvas de aprendizaje tediosas.
            </p>
          </div>

          <div className="how-steps-flex">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="how-step-card">
                <div className="how-step-circle">{step.num}</div>
                <h3 className="how-card-title">{step.title}</h3>
                <p className="how-card-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 8. TESTIMONIALS ======== */}
      <section className="landing-testimonials-section" id="testimonials">
        <div className="landing-container">
          <div className="center-header">
            <div className="landing-badge">
              <IconUsers />
              <span>Opiniones & Casos de Éxito</span>
            </div>
            <h2 className="landing-title">La confianza de los técnicos</h2>
            <p className="landing-subtitle">
              Clubes y analistas de diferentes categorías ya potencian sus plantillas con HandStats.
            </p>
          </div>

          <div className="testimonials-grid-3">
            {TESTIMONIALS_DATA.map((t, i) => (
              <div key={i} className="testimonial-bubble">
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-user-row">
                  <div className="testimonial-user-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-user-name">{t.name}</div>
                    <div className="testimonial-user-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 9. FINAL CTA ======== */}
      <section className="landing-cta-banner">
        <div className="cta-box-center">
          <h2 className="cta-main-title">
            ¿Preparado para revolucionar tu balonmano?
          </h2>
          <p className="cta-desc-p">
            Únete a la nueva era del análisis deportivo. Comienza a registrar partidos de forma gratuita hoy mismo.
          </p>
          <button className="btn-hero-primary" onClick={handleTry} style={{ margin: "0 auto" }}>
            <span>Probar HandStats Ahora</span>
            <IconArrowRight />
          </button>
        </div>
      </section>

      {/* ======== 10. FOOTER ======== */}
      <footer className="landing-footer-main">
        <div className="footer-content-row">
          <div className="footer-brand-side">
            <img src={logoHorizontal} alt="HandStats" />
            <span className="footer-tagline">Analyze. Improve. Win.</span>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} HandStats. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

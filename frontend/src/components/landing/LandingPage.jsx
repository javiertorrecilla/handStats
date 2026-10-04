import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../common/LanguageSelector";
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

/* Data objects localized inside LandingPage component via useTranslation */

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
  const { t } = useTranslation();
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

  const marqueeItems1 = t("stats_marquee.items", { returnObjects: true }) || [];
  const marqueeItems2 = t("stats_marquee.motto", { returnObjects: true }) || [];

  const statsData = [
    { value: 8, suffix: "+", label: t("landing_stats.stat1_label") },
    { value: 96, suffix: "%", label: t("landing_stats.stat2_label") },
    { value: 500, suffix: "+", label: t("landing_stats.stat3_label") },
    { value: 100, suffix: "%", label: t("landing_stats.stat4_label") },
  ];

  const productTabs = [
    {
      id: "dashboard",
      label: t("product.tab_dashboard"),
      tag: t("product.dashboard_tag"),
      title: t("product.dashboard_title"),
      desc: t("product.dashboard_desc"),
      checks: [
        t("product.dashboard_check1"),
        t("product.dashboard_check2"),
        t("product.dashboard_check3")
      ],
      image: "/dashboard-mockup.jpg"
    },
    {
      id: "shots",
      label: t("product.tab_shots"),
      tag: t("product.shots_tag"),
      title: t("product.shots_title"),
      desc: t("product.shots_desc"),
      checks: [
        t("product.shots_check1"),
        t("product.shots_check2"),
        t("product.shots_check3")
      ],
      image: "/laptop-mockup.jpg"
    },
    {
      id: "players",
      label: t("product.tab_players"),
      tag: t("product.players_tag"),
      title: t("product.players_title"),
      desc: t("product.players_desc"),
      checks: [
        t("product.players_check1"),
        t("product.players_check2"),
        t("product.players_check3")
      ],
      image: "/tablet-mockup.jpg"
    },
    {
      id: "reports",
      label: t("product.tab_reports"),
      tag: t("product.reports_tag"),
      title: t("product.reports_title"),
      desc: t("product.reports_desc"),
      checks: [
        t("product.reports_check1"),
        t("product.reports_check2"),
        t("product.reports_check3")
      ],
      image: "/dashboard-mockup.jpg"
    }
  ];

  const deviceDetails = {
    desktop: {
      badge: t("product.device_desktop_badge"),
      title: t("product.device_desktop_title"),
      desc: t("product.device_desktop_desc"),
      points: [
        { bold: t("product.device_desktop_p1_bold"), text: t("product.device_desktop_p1_text") },
        { bold: t("product.device_desktop_p2_bold"), text: t("product.device_desktop_p2_text") },
        { bold: t("product.device_desktop_p3_bold"), text: t("product.device_desktop_p3_text") }
      ],
      image: "/laptop-mockup.jpg"
    },
    tablet: {
      badge: t("product.device_tablet_badge"),
      title: t("product.device_tablet_title"),
      desc: t("product.device_tablet_desc"),
      points: [
        { bold: t("product.device_tablet_p1_bold"), text: t("product.device_tablet_p1_text") },
        { bold: t("product.device_tablet_p2_bold"), text: t("product.device_tablet_p2_text") },
        { bold: t("product.device_tablet_p3_bold"), text: t("product.device_tablet_p3_text") }
      ],
      image: "/tablet-mockup.jpg"
    }
  };

  const featuresList = [
    {
      icon: <IconZap />,
      title: t("features.f1_title"),
      desc: t("features.f1_desc")
    },
    {
      icon: <IconBarChart />,
      title: t("features.f2_title"),
      desc: t("features.f2_desc")
    },
    {
      icon: <IconFlame />,
      title: t("features.f3_title"),
      desc: t("features.f3_desc")
    },
    {
      icon: <IconShield />,
      title: t("features.f4_title"),
      desc: t("features.f4_desc")
    },
    {
      icon: <IconUsers />,
      title: t("features.f5_title"),
      desc: t("features.f5_desc")
    },
    {
      icon: <IconFileText />,
      title: t("features.f6_title"),
      desc: t("features.f6_desc")
    }
  ];

  const howSteps = [
    {
      num: "01",
      title: t("how_it_works.step1_title"),
      desc: t("how_it_works.step1_desc")
    },
    {
      num: "02",
      title: t("how_it_works.step2_title"),
      desc: t("how_it_works.step2_desc")
    },
    {
      num: "03",
      title: t("how_it_works.step3_title"),
      desc: t("how_it_works.step3_desc")
    }
  ];

  const currentTab = productTabs.find(t => t.id === activeTabId) || productTabs[0];
  const activeDeviceData = deviceDetails[selectedDevice] || deviceDetails.desktop;

  return (
    <div className="landing-page">
      {/* ======== 1. NAVBAR ======== */}
      <header className={`landing-nav-wrapper ${navScrolled ? "scrolled" : ""}`}>
        <div className="landing-nav-bar">
          <a href="#hero" className="landing-nav-brand" onClick={(e) => { e.preventDefault(); scrollTo("hero"); }}>
            <img src={logoHorizontal} alt="HandStats — Analyze. Improve. Win." />
          </a>

          <nav className="landing-nav-menu">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>{t("nav.features")}</a>
            <a href="#product" onClick={(e) => { e.preventDefault(); scrollTo("product"); }}>{t("nav.product")}</a>
            <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>{t("nav.how_it_works")}</a>
          </nav>

          <div className="landing-nav-actions">
            <LanguageSelector compact />

            {toggleTheme && (
              <button 
                type="button"
                className="btn-theme-toggle-lp"
                onClick={toggleTheme}
                title={theme === "dark" ? t("common.switch_to_light") : t("common.switch_to_dark")}
                aria-label="Cambiar tema de color"
              >
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
            )}

            <button className="btn-nav-try" onClick={handleTry}>
              <span>{t("nav.try_handstats")}</span>
              <IconArrowRight />
            </button>

            <button 
              className="landing-nav-toggle" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t("nav.open_menu")}
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
          aria-label={t("nav.close_menu")}
        >
          <IconX />
        </button>

        <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo("features"); }}>{t("nav.features")}</a>
        <a href="#product" onClick={(e) => { e.preventDefault(); scrollTo("product"); }}>{t("nav.product")}</a>
        <a href="#how" onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>{t("nav.how_it_works")}</a>
        
        <div style={{ padding: "6px 0", display: "flex", justifyContent: "center" }}>
          <LanguageSelector />
        </div>

        {toggleTheme && (
          <button 
            type="button"
            className="btn-hero-secondary"
            onClick={toggleTheme}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
            <span>{theme === "dark" ? t("common.light_mode") : t("common.dark_mode")}</span>
          </button>
        )}

        <button className="btn-hero-primary" onClick={handleTry} style={{ width: "100%", justifyContent: "center" }}>
          <span>{t("nav.try_handstats_now")}</span>
          <IconArrowRight />
        </button>
      </div>

      {/* ======== 2. HERO WITH STYLIZED HANDBALL COURT & SCOREBOARD PLACARS ======== */}
      <section className="landing-hero" id="hero">
        {/* Authentic Handball Court Geometry Vector Backdrop */}
        <div className="hero-handball-court-bg" aria-hidden="true">
          <svg viewBox="0 0 1200 600" className="hero-court-svg" preserveAspectRatio="none">
            {/* Perimeter Line */}
            <rect x="2" y="2" width="1196" height="596" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.14" />
            {/* Center Line & Center Throw-off Circle */}
            <line x1="600" y1="0" x2="600" y2="600" stroke="currentColor" strokeWidth="2" strokeOpacity="0.18" />
            <circle cx="600" cy="300" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.16" />
            {/* Left 6m Goal Area (D-zone) */}
            <path d="M 0 190 L 110 190 A 110 110 0 0 1 110 410 L 0 410" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.22" />
            {/* Left 7m Penalty Mark */}
            <line x1="155" y1="285" x2="155" y2="315" stroke="currentColor" strokeWidth="3" strokeOpacity="0.30" />
            {/* Left 9m Free Throw Line (Dashed) */}
            <path d="M 0 135 L 165 135 A 165 165 0 0 1 165 465 L 0 465" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="10 8" strokeOpacity="0.18" />
            {/* Left 4m Goalkeeper Line */}
            <line x1="75" y1="288" x2="75" y2="312" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
            {/* Right 6m Goal Area (D-zone) */}
            <path d="M 1200 190 L 1090 190 A 110 110 0 0 0 1090 410 L 1200 410" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.22" />
            {/* Right 7m Penalty Mark */}
            <line x1="1045" y1="285" x2="1045" y2="315" stroke="currentColor" strokeWidth="3" strokeOpacity="0.30" />
            {/* Right 9m Free Throw Line (Dashed) */}
            <path d="M 1200 135 L 1035 135 A 165 165 0 0 0 1035 465 L 1200 465" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="10 8" strokeOpacity="0.18" />
            {/* Right 4m Goalkeeper Line */}
            <line x1="1125" y1="288" x2="1125" y2="312" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
          </svg>
          <div className="hero-court-grain-filter" />
        </div>

        {/* Floating Animated Scoreboard & Tactical Placars (Asymmetric, Sports Character) */}
        <div className="hero-floating-elements-layer">
          {/* Placar 1: Live Match Scorebug Placar (Top Left - High visual hierarchy) */}
          <div className="hero-placar-tile hero-placar-scorebug">
            <div className="placar-top-bar">
              <div className="placar-live-indicator">
                <span className="live-dot-pulse" />
                <span>{t("hero.card_live")}</span>
              </div>
              <span className="scorebug-tag amber">{t("hero.card_live_tag")}</span>
            </div>
            <div className="placar-scoreboard-grid">
              <div className="scoreboard-team-row">
                <span className="scoreboard-team-name">BM GRANOLLERS</span>
                <span className="scoreboard-team-pts">28</span>
              </div>
              <div className="scoreboard-team-row">
                <span className="scoreboard-team-name">CD BADAJOZ</span>
                <span className="scoreboard-team-pts">24</span>
              </div>
            </div>
            <div className="placar-possession-bar-wrap">
              <div className="possession-labels">
                <span>{t("hero.card_possession")}: 56%</span>
                <span>44%</span>
              </div>
              <div className="possession-split-track">
                <div className="possession-fill-home" style={{ width: "56%" }} />
                <div className="possession-fill-away" style={{ width: "44%" }} />
              </div>
            </div>
          </div>

          {/* Placar 2: Expected Goals (xG) Model (Top Right) */}
          <div className="hero-placar-tile hero-placar-xg">
            <div className="placar-top-bar">
              <span className="placar-tag-label">{t("hero.card_xg_label")}</span>
              <span className="scorebug-tag green">{t("hero.card_xg_tag")}</span>
            </div>
            <div className="xg-main-readout">
              <div className="xg-big-digit">8.4 <span className="xg-unit">xG</span></div>
              <span className="xg-quality-badge">{t("hero.card_xg_quality")}</span>
            </div>
            <div className="xg-card-bars">
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "45%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "70%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill amber" style={{ height: "92%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "60%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill" style={{ height: "85%" }} /></div>
              <div className="xg-bar-col"><div className="xg-bar-fill amber" style={{ height: "100%" }} /></div>
            </div>
          </div>

          {/* Placar 3: Shot Efficiency Gauge (Mid-Left) */}
          <div className="hero-placar-tile hero-placar-donut">
            <div className="placar-top-bar">
              <span className="placar-tag-label">{t("hero.card_shot_eff_label")}</span>
              <span className="scorebug-tag green">78%</span>
            </div>
            <div className="donut-card-inner">
              <div className="donut-svg-wrap">
                <svg width="48" height="48" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="3.6"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="3.6"
                    strokeDasharray="78, 100"
                    strokeLinecap="square"
                  />
                </svg>
                <div className="donut-center-text">78%</div>
              </div>
              <div className="donut-data-text">
                <div className="stat-card-val-big">28 / 36</div>
                <div className="donut-sub-label">{t("hero.card_shot_eff_sub")}</div>
              </div>
            </div>
          </div>

          {/* Placar 4: Scouting MVP Placar (Bottom Right) */}
          <div className="hero-placar-tile hero-placar-player">
            <div className="placar-top-bar">
              <span className="placar-tag-label">{t("hero.card_mvp_label")}</span>
              <span className="scorebug-tag amber">{t("hero.card_mvp_tag")}</span>
            </div>
            <div className="player-card-flex">
              <div>
                <div className="scout-player-name">M. ANDERSSON</div>
                <div className="scout-player-dorsal">{t("hero.card_mvp_pos")}</div>
                <div className="scout-player-stats">{t("hero.card_mvp_stats")}</div>
              </div>
              <div className="player-rating-box">9.2</div>
            </div>
          </div>

          {/* Placar 5: Goalkeeper Saves % (Bottom Left) */}
          <div className="hero-placar-tile hero-placar-gk">
            <div className="placar-top-bar">
              <span className="placar-tag-label">{t("hero.card_gk_label")}</span>
              <span className="scorebug-tag blue">{t("hero.card_gk_tag")}</span>
            </div>
            <div className="gk-readout-row">
              <div className="gk-big-pct">42%</div>
              <div className="gk-breakdown">
                <div>6m: 5/11 (45%)</div>
                <div>9m: 7/14 (50%)</div>
              </div>
            </div>
          </div>

          {/* Placar 6: 7m Penalty Record (Bottom Center Right) */}
          <div className="hero-placar-tile hero-placar-7m">
            <div className="placar-top-bar">
              <span className="placar-tag-label">{t("hero.card_penalty_label")}</span>
              <span className="scorebug-tag green">{t("hero.card_penalty_tag")}</span>
            </div>
            <div className="penalty-readout-val">5 / 5 <span className="penalty-note">{t("hero.card_penalty_shots")}</span></div>
          </div>
        </div>

        {/* Central Hero Content — Broadcast Typography */}
        <div className="hero-content-center">
          {/* Architectural Sports Eyebrow */}
          <div className="hero-eyebrow-bar">
            <span className="hero-eyebrow-accent">{t("hero.eyebrow_pro")}</span>
            <span className="hero-eyebrow-sep">/</span>
            <span className="hero-eyebrow-spec">{t("hero.eyebrow_spec")}</span>
          </div>

          <h1 className="hero-main-title">
            {t("hero.title_line1")}<br />
            <span className="hero-title-highlight">{t("hero.title_line2")}</span>
          </h1>

          <p className="hero-desc">
            {t("hero.subtitle")}
          </p>

          <div className="hero-buttons-row">
            <button className="btn-hero-primary" onClick={handleTry}>
              <span>{t("hero.btn_try")}</span>
              <IconArrowRight />
            </button>

            <button className="btn-hero-secondary" onClick={() => scrollTo("product")}>
              <IconBarChart />
              <span>{t("hero.btn_demo")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======== 3. MARQUEE BARS ======== */}
      <div className="landing-marquee">
        <div className="marquee-content">
          {[...marqueeItems1, ...marqueeItems1].map((item, i) => (
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
            {statsData.map((s, i) => (
              <StatCounterCard key={i} {...s} />
            ))}
          </div>
        </div>
      </section>

      <div className="landing-marquee green-accent reverse">
        <div className="marquee-content">
          {[...marqueeItems2, ...marqueeItems2].map((item, i) => (
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
            <div className="section-broadcast-kicker">
              <span className="section-kicker-num">{t("product.kicker_num")}</span>
              <span className="section-kicker-title">{t("product.kicker_title")}</span>
            </div>
            <h2 className="landing-title">{t("product.title")}</h2>
            <p className="landing-subtitle">
              {t("product.subtitle")}
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="product-tabs-nav">
            {productTabs.map((tab) => (
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
              <h3 className="device-selector-title">{t("product.device_title")}</h3>
              <p className="device-selector-subtitle">{t("product.device_subtitle")}</p>
            </div>

            {/* Toggle Buttons: Desktop/Laptop vs Tablet */}
            <div className="device-buttons-group">
              <button
                type="button"
                className={`btn-device-toggle ${selectedDevice === "desktop" ? "active" : ""}`}
                onClick={() => setSelectedDevice("desktop")}
              >
                <IconLaptop />
                <span>{t("product.device_desktop_btn")}</span>
              </button>

              <button
                type="button"
                className={`btn-device-toggle ${selectedDevice === "tablet" ? "active" : ""}`}
                onClick={() => setSelectedDevice("tablet")}
              >
                <IconTablet />
                <span>{t("product.device_tablet_btn")}</span>
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
            <div className="section-broadcast-kicker">
              <span className="section-kicker-num">{t("features.kicker_num")}</span>
              <span className="section-kicker-title">{t("features.kicker_title")}</span>
            </div>
            <h2 className="landing-title">{t("features.title")}</h2>
            <p className="landing-subtitle">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="features-grid-3">
            {featuresList.map((feat, i) => (
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
            <div className="section-broadcast-kicker">
              <span className="section-kicker-num">{t("how_it_works.kicker_num")}</span>
              <span className="section-kicker-title">{t("how_it_works.kicker_title")}</span>
            </div>
            <h2 className="landing-title">{t("how_it_works.title")}</h2>
            <p className="landing-subtitle">
              {t("how_it_works.subtitle")}
            </p>
          </div>

          <div className="how-steps-flex">
            {howSteps.map((step, i) => (
              <div key={i} className="how-step-card">
                <div className="how-step-circle">{step.num}</div>
                <h3 className="how-card-title">{step.title}</h3>
                <p className="how-card-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== 8. FINAL CTA ======== */}
      <section className="landing-cta-banner">
        <div className="cta-box-center">
          <h2 className="cta-main-title">
            {t("cta.title")}
          </h2>
          <p className="cta-desc-p">
            {t("cta.desc")}
          </p>
          <button className="btn-hero-primary" onClick={handleTry} style={{ margin: "0 auto" }}>
            <span>{t("cta.btn")}</span>
            <IconArrowRight />
          </button>
        </div>
      </section>

      {/* ======== 9. FOOTER ======== */}
      <footer className="landing-footer-main">
        <div className="footer-content-row">
          <div className="footer-brand-side">
            <img src={logoHorizontal} alt="HandStats" />
            <span className="footer-tagline">Analyze. Improve. Win.</span>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "../common/LanguageSelector";
import isotipo from "../../assets/isotipo.png";
import "./Sidebar.css";

const IconCalendar = () => (
  <svg className="sidebar-item-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconTeams = () => (
  <svg className="sidebar-item-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSettings = () => (
  <svg className="sidebar-item-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="sidebar-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconLogout = () => (
  <svg className="sidebar-logout-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconSun = () => (
  <svg className="theme-toggle-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  <svg className="theme-toggle-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconHamburger = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function Sidebar({
  user,
  guestMatches,
  logout,
  theme = "light",
  toggleTheme,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const pathname = location?.pathname || "";
  const isMatchesActive = pathname === "/matches" || pathname === "/matches/new" || pathname === "/";
  const isTeamsActive = pathname === "/teams";
  const isSettingsActive = pathname === "/settings";

  const handleSelectRoute = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    if (logout) await logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="mobile-header-bar">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={t("sidebar.open_nav")}
        >
          <IconHamburger />
        </button>
        <div className="mobile-brand-title">
          HAND<span>STATS</span>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src={isotipo} alt="HandStats Emblem" className="sidebar-logo-img" />
            <div className="sidebar-brand-text">
              <h1 className="sidebar-title">HAND<span>STATS</span></h1>
              <span className="sidebar-tagline">ANALYZE. IMPROVE. WIN.</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label={t("sidebar.close_menu")}
          >
            <IconClose />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${isMatchesActive ? "active" : ""}`}
            onClick={() => handleSelectRoute("/matches")}
          >
            <div className="sidebar-icon-box">
              <IconCalendar />
            </div>
            <span className="sidebar-item-label">{t("sidebar.my_matches")}</span>
            <IconChevronRight />
          </button>

          {user.role !== "guest" && (
            <button
              className={`sidebar-item ${isTeamsActive ? "active" : ""}`}
              onClick={() => handleSelectRoute("/teams")}
            >
              <div className="sidebar-icon-box">
                <IconTeams />
              </div>
              <span className="sidebar-item-label">{t("sidebar.teams")}</span>
              <IconChevronRight />
            </button>
          )}

          <button
            className={`sidebar-item ${isSettingsActive ? "active" : ""}`}
            onClick={() => handleSelectRoute("/settings")}
          >
            <div className="sidebar-icon-box">
              <IconSettings />
            </div>
            <span className="sidebar-item-label">{t("sidebar.settings")}</span>
            <IconChevronRight />
          </button>
        </nav>

        <div className="sidebar-bottom">
          <LanguageSelector direction="up" className="sidebar-lang-selector" />

          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? t("sidebar.switch_to_light") : t("sidebar.switch_to_dark")}
          >
            <div className="theme-toggle-left">
              {theme === "dark" ? <IconMoon /> : <IconSun />}
              <span>{theme === "dark" ? t("sidebar.dark_mode") : t("sidebar.light_mode")}</span>
            </div>
            <div className={`theme-toggle-switch ${theme === "dark" ? "dark-active" : ""}`}>
              <span className="theme-toggle-handle"></span>
            </div>
          </button>

          <div className="sidebar-user-card">
            <div className="sidebar-avatar-container">
              <div className="sidebar-user-avatar">
                {user.role === "guest" ? "G" : (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
              </div>
              <span className="status-dot-online" title={t("common.connected")}></span>
            </div>

            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user.role === "guest"
                  ? t("sidebar.guest_user")
                  : user.displayName || user.email?.split("@")[0]}
              </span>
              <span className="user-role-badge">
                {user.role === "guest" ? t("sidebar.guest_role", { count: guestMatches }) : t("sidebar.coach_role")}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title={t("sidebar.logout")}
          >
            <IconLogout />
            <span>{t("sidebar.logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
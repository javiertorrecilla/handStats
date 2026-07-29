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

export default function Sidebar({
  user,
  guestMatches,
  logout,
  view,
  setView,
}) {
  const isMatchesActive = view === "list" || view === "create";

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand-header">
          <div className="sidebar-logo-glow-wrapper">
            <img src={isotipo} alt="HandStats Emblem" className="sidebar-brand-logo" />
          </div>
          <div className="sidebar-brand-details">
            <h1 className="sidebar-brand-title">HAND<span>STATS</span></h1>
            <span className="sidebar-brand-tagline">ANALYZE. IMPROVE. WIN.</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${isMatchesActive ? "active" : ""}`}
          onClick={() => setView("list")}
        >
          <div className="sidebar-icon-box">
            <IconCalendar />
          </div>
          <span className="sidebar-item-label">Mis Partidos</span>
          <IconChevronRight />
        </button>

        {user.role !== "guest" && (
          <button
            className={`sidebar-item ${view === "teams" ? "active" : ""}`}
            onClick={() => setView("teams")}
          >
            <div className="sidebar-icon-box">
              <IconTeams />
            </div>
            <span className="sidebar-item-label">Equipos</span>
            <IconChevronRight />
          </button>
        )}

        <button
          className={`sidebar-item ${view === "settings" ? "active" : ""}`}
          onClick={() => setView("settings")}
        >
          <div className="sidebar-icon-box">
            <IconSettings />
          </div>
          <span className="sidebar-item-label">Ajustes de Parámetros</span>
          <IconChevronRight />
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar-container">
            <div className="sidebar-user-avatar">
              {user.role === "guest" ? "G" : (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <span className="status-dot-online" title="Conectado"></span>
          </div>

          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {user.role === "guest"
                ? "Usuario Invitado"
                : user.displayName || user.email?.split("@")[0]}
            </span>
            <span className="user-role-badge">
              {user.role === "guest" ? `Demo (${guestMatches}/3 partidos)` : "Entrenador / Analista"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={logout}
          title="Cerrar sesión"
        >
          <IconLogout />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
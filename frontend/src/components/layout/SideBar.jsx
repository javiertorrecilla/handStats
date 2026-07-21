import "./Sidebar.css";

const IconHandball = () => (
  <svg className="sidebar-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 22" />
    <path d="M12 2a14.5 14.5 0 0 1 0 22" />
    <path d="M2 12h20" />
  </svg>
);

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

        <div className="sidebar-logo">
          <IconHandball />
        </div>

        <h2>HandStats</h2>

        <span className="sidebar-tagline">
          Analizador de partidos
        </span>

      </div>

      <nav className="sidebar-nav">

        <button
          className={`sidebar-item ${isMatchesActive ? "active" : ""}`}
          onClick={() => setView("list")}
        >
          <IconCalendar />
          <span>Mis Partidos</span>
        </button>

        {user.role !== "guest" && (
          <button
            className={`sidebar-item ${view === "teams" ? "active" : ""}`}
            onClick={() => setView("teams")}
          >
            <IconTeams />
            <span>Equipos</span>
          </button>
        )}

      </nav>

      <div className="sidebar-bottom">

        <div className="sidebar-user">
          {user.role === "guest"
            ? `Invitado (${guestMatches}/3)`
            : user.displayName || user.email}
        </div>

        <button
          className="btn btn-danger w-100"
          onClick={logout}
        >
          Salir
        </button>

      </div>

    </aside>
  );
}
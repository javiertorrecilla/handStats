import "./Matches.css";

import MatchCard from "./MatchCard";

const IconCalendar = () => (
  <svg className="page-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconStadium = () => (
  <svg className="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="10" ry="5" />
    <path d="M2 12v4a10 5 0 0 0 20 0v-4" />
    <path d="M12 7v5" />
    <path d="M8 8v4" />
    <path d="M16 8v4" />
  </svg>
);

export default function MatchesPage({
  matchesList,
  loadMatch,
  onCreateNew,
  onDeleteMatch,
  isGuest,
  guestMatches,
}) {
  const canCreate = !isGuest || guestMatches < 3;

  return (
    <div className="matches-page">

      <div className="matches-header">
        <h2 className="matches-header-title">
          <IconCalendar />
          <span>Mis Partidos</span>
        </h2>

        <button
          className="btn btn-primary"
          onClick={onCreateNew}
          disabled={!canCreate}
        >
          + Nuevo Partido
        </button>
      </div>

      {isGuest && (
        <div className="guest-banner">
          Modo invitado — {guestMatches}/3 partidos usados.
          {!canCreate && " Has alcanzado el límite."}
        </div>
      )}

      <div className="matches-list">

        {matchesList.length === 0 ? (

          <div className="empty-matches">
            <div className="empty-icon">
              <IconStadium />
            </div>
            <h3>No hay partidos aún</h3>
            <p>Crea tu primer partido para empezar a analizar.</p>
            <button
              className="btn btn-primary"
              onClick={onCreateNew}
              disabled={!canCreate}
            >
              Crear primer partido
            </button>
          </div>

        ) : (

          matchesList.map((match) => (
            <MatchCard
              key={match._id}
              match={match}
              loadMatch={loadMatch}
              onDelete={onDeleteMatch}
            />
          ))

        )}

      </div>

    </div>
  );
}
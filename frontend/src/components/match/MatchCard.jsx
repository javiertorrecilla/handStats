export default function MatchCard({
  match,
  loadMatch,
  onDelete,
}) {
  const dateStr = match.date
    ? new Date(match.date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "";

  return (
    <div
      className="match-card"
      onClick={() => loadMatch(match._id)}
    >
      <div className="match-card-teams">
        <span className="match-team home">
          {match.home_team}
        </span>

        <div className="match-score">
          {match.goals_home} - {match.goals_away}
        </div>

        <span className="match-team away">
          {match.away_team}
        </span>
      </div>

      <div className="match-card-meta">
        <span className="match-date">{dateStr}</span>

        <div className="match-card-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              loadMatch(match._id, "live");
            }}
          >
            Mesa de Control
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              loadMatch(match._id, "stats");
            }}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 14, height: 14, display: "inline-block", verticalAlign: "middle" }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> Estadísticas
          </button>

          {onDelete && (
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(match._id);
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
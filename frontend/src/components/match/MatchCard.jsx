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
              loadMatch(match._id);
            }}
          >
            Analizar Partido
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
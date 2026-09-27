import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const canCreate = !isGuest || guestMatches < 3;

  return (
    <div className="matches-page">

      <div className="matches-header">
        <h2 className="matches-header-title">
          <IconCalendar />
          <span>{t("matches.title")}</span>
        </h2>

        <button
          className="btn btn-primary"
          onClick={onCreateNew}
          disabled={!canCreate}
        >
          {t("matches.new_match")}
        </button>
      </div>

      {isGuest && (
        <div className="guest-banner">
          {t("matches.guest_banner", { used: guestMatches })}
          {!canCreate && t("matches.limit_reached")}
        </div>
      )}

      <div className="matches-list">

        {matchesList.length === 0 ? (

          <div className="empty-matches">
            <div className="empty-icon">
              <IconStadium />
            </div>
            <h3>{t("matches.no_matches_title")}</h3>
            <p>{t("matches.no_matches_desc")}</p>
            <button
              className="btn btn-primary"
              onClick={onCreateNew}
              disabled={!canCreate}
            >
              {t("matches.create_first_match")}
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
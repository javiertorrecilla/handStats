import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PlayerListEditor from "./PlayerListEditor";
import PdfUploader from "./PdfUploader";
import userService from "../../services/userService";

const IconHandball = () => (
  <svg className="page-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, width: 22, height: 22, display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 22" />
    <path d="M12 2a14.5 14.5 0 0 1 0 22" />
    <path d="M2 12h20" />
  </svg>
);

const IconStadium = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 8, width: 20, height: 20, display: "inline-block", verticalAlign: "middle" }}>
    <ellipse cx="12" cy="12" rx="10" ry="5" />
    <path d="M2 12v4a10 5 0 0 0 20 0v-4" />
  </svg>
);

export default function CreateMatchPage({
  user,
  onMatchCreated,
  onCancel,
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  // Paso 1 — Equipos
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeLogo, setHomeLogo] = useState(null);
  const [awayLogo, setAwayLogo] = useState(null);

  // Paso 2/3 — Jugadores
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  // Equipos guardados del usuario
  const [savedTeams, setSavedTeams] = useState([]);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const [showAwaySuggestions, setShowAwaySuggestions] = useState(false);

  // Cargar equipos guardados
  useEffect(() => {
    if (user?.role === "guest" || !user?._id) return;

    const loadSavedTeams = async () => {
      try {
        const teams = await userService.getSavedTeams(user._id);
        setSavedTeams(teams || []);
      } catch (err) {
        console.log("No se pudieron cargar equipos guardados:", err);
      }
    };

    loadSavedTeams();
  }, [user]);

  // Seleccionar equipo guardado
  const selectSavedTeam = (team, side) => {
    const mappedPlayers = (team.players || []).map((p, idx) => ({
      ...p,
      selected: idx < 16, // Convocados los primeros 16 por defecto
    }));

    if (side === "home") {
      setHomeTeam(team.name);
      if (team.logo_url) setHomeLogo(team.logo_url);
      setHomePlayers(mappedPlayers);
      setShowHomeSuggestions(false);
    } else {
      setAwayTeam(team.name);
      if (team.logo_url) setAwayLogo(team.logo_url);
      setAwayPlayers(mappedPlayers);
      setShowAwaySuggestions(false);
    }
  };

  // Filtrar sugerencias
  const getFilteredTeams = (query) => {
    if (!query.trim()) return savedTeams;
    return savedTeams.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Manejar resultado del PDF
  const handlePdfParsed = (result) => {
    const homeName = result.home_team || "";
    const awayName = result.away_team || "";

    if (homeName) setHomeTeam(homeName);
    if (awayName) setAwayTeam(awayName);
    if (result.home_logo) setHomeLogo(result.home_logo);
    if (result.away_logo) setAwayLogo(result.away_logo);

    // Buscar si tenemos los equipos guardados para cruzar los roles de portero
    const savedHome = savedTeams.find(
      (t) => t.name.toLowerCase() === homeName.toLowerCase()
    );
    const savedAway = savedTeams.find(
      (t) => t.name.toLowerCase() === awayName.toLowerCase()
    );

    const mapParsedPlayers = (parsedList, savedTeam) => {
      return (parsedList || []).map((p, idx) => {
        const selected = idx < 16;
        if (savedTeam && savedTeam.players) {
          const savedPlayer = savedTeam.players.find(
            (sp) => sp.number === p.number || sp.name.toLowerCase() === p.name.toLowerCase()
          );
          if (savedPlayer) {
            return {
              ...p,
              selected,
              is_goalkeeper: savedPlayer.is_goalkeeper === true || savedPlayer.is_goalkeeper === "true",
            };
          }
        }
        const isGk = [1, 12, 16].includes(p.number) || p.is_goalkeeper === true;
        return {
          ...p,
          selected,
          is_goalkeeper: isGk,
        };
      });
    };

    if (result.home_players?.length > 0) {
      setHomePlayers(mapParsedPlayers(result.home_players, savedHome));
    }
    if (result.away_players?.length > 0) {
      setAwayPlayers(mapParsedPlayers(result.away_players, savedAway));
    }

    // Auto-guardar/actualizar escudo extraído en la biblioteca de equipos del usuario
    if (user?._id) {
      if (homeName && result.home_logo) {
        userService.saveTeam(user._id, {
          name: homeName,
          logo_url: result.home_logo,
          players: result.home_players || []
        }).catch(err => console.log("Auto-save team logo error:", err));
      }
      if (awayName && result.away_logo) {
        userService.saveTeam(user._id, {
          name: awayName,
          logo_url: result.away_logo,
          players: result.away_players || []
        }).catch(err => console.log("Auto-save team logo error:", err));
      }
    }

    // Ir directamente al paso de jugadores para comprobarlo y editarlo
    setStep(2);
  };

  // Validaciones
  const canGoStep2 = homeTeam.trim() && awayTeam.trim();
  const homeSelectedCount = homePlayers.filter(p => p.selected !== false).length;
  const awaySelectedCount = awayPlayers.filter(p => p.selected !== false).length;
  const canCreate = (homeSelectedCount > 0 || awaySelectedCount > 0) && homeSelectedCount <= 16 && awaySelectedCount <= 16;

  // Crear partido
  const handleCreate = () => {
    onMatchCreated({
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      home_logo: homeLogo,
      away_logo: awayLogo,
      home_players: homePlayers,
      away_players: awayPlayers,
    });
  };

  return (
    <div className="create-match-page">

      <div className="create-match-header">
        <h2 style={{ display: "flex", alignItems: "center" }}>
          <IconHandball />
          <span>{t("create_match.title")}</span>
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>

      {/* STEPPER */}
      <div className="stepper">
        <div className={`stepper-step ${step >= 1 ? "active" : ""}`}>
          <div className="stepper-circle">1</div>
          <span>{t("create_match.step1")}</span>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-step ${step >= 2 ? "active" : ""}`}>
          <div className="stepper-circle">2</div>
          <span>{t("create_match.step2")}</span>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-step ${step >= 3 ? "active" : ""}`}>
          <div className="stepper-circle">3</div>
          <span>{t("create_match.step3")}</span>
        </div>
      </div>

      {/* PASO 1 — EQUIPOS */}
      {step === 1 && (
        <div className="step-content">

          <div className="teams-form">

            <div className="team-input-group">
              <label>{t("create_match.home_team")}</label>
              <div className="autocomplete-wrapper">
                <input
                  className="input-field"
                  type="text"
                  placeholder={t("create_match.home_placeholder")}
                  value={homeTeam}
                  onChange={(e) => {
                    setHomeTeam(e.target.value);
                    setShowHomeSuggestions(true);
                  }}
                  onFocus={() => setShowHomeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowHomeSuggestions(false), 200)}
                />
                {showHomeSuggestions && getFilteredTeams(homeTeam).length > 0 && (
                  <div className="autocomplete-dropdown">
                    {getFilteredTeams(homeTeam).map((tItem, i) => (
                      <button
                        key={i}
                        className="autocomplete-item"
                        onMouseDown={() => selectSavedTeam(tItem, "home")}
                      >
                        {tItem.name}
                        <span className="autocomplete-badge">
                          {t("create_match.players_count", { count: tItem.players?.length || 0 })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="vs-divider">{t("common.vs")}</div>

            <div className="team-input-group">
              <label>{t("create_match.away_team")}</label>
              <div className="autocomplete-wrapper">
                <input
                  className="input-field"
                  type="text"
                  placeholder={t("create_match.away_placeholder")}
                  value={awayTeam}
                  onChange={(e) => {
                    setAwayTeam(e.target.value);
                    setShowAwaySuggestions(true);
                  }}
                  onFocus={() => setShowAwaySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAwaySuggestions(false), 200)}
                />
                {showAwaySuggestions && getFilteredTeams(awayTeam).length > 0 && (
                  <div className="autocomplete-dropdown">
                    {getFilteredTeams(awayTeam).map((tItem, i) => (
                      <button
                        key={i}
                        className="autocomplete-item"
                        onMouseDown={() => selectSavedTeam(tItem, "away")}
                      >
                        {tItem.name}
                        <span className="autocomplete-badge">
                          {t("create_match.players_count", { count: tItem.players?.length || 0 })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="pdf-section">
            <p className="pdf-hint">
              {t("create_match.pdf_hint")}
            </p>
            <PdfUploader onParsed={handlePdfParsed} />
          </div>

          <div className="step-actions">
            <button
              className="btn btn-primary"
              disabled={!canGoStep2}
              onClick={() => setStep(2)}
            >
              {t("create_match.next")}
            </button>
          </div>

        </div>
      )}

      {/* PASO 2 — JUGADORES */}
      {step === 2 && (
        <div className="step-content">

          <div className="players-columns">
            <PlayerListEditor
              players={homePlayers}
              setPlayers={setHomePlayers}
              teamLabel={homeTeam}
            />

            <PlayerListEditor
              players={awayPlayers}
              setPlayers={setAwayPlayers}
              teamLabel={awayTeam}
            />
          </div>

          <div className="step-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              {t("create_match.back")}
            </button>
            <button
              className="btn btn-primary"
              disabled={!canCreate}
              onClick={() => setStep(3)}
            >
              {t("create_match.next")}
            </button>
          </div>

        </div>
      )}

      {/* PASO 3 — CONFIRMAR */}
      {step === 3 && (
        <div className="step-content">

          <div className="confirm-summary">

            <div className="confirm-teams">
              <div className="confirm-team">
                <h3>{homeTeam}</h3>
                <span className="confirm-label">{t("common.home")}</span>
                <p>{t("create_match.players_count", { count: homePlayers.length })}</p>
              </div>

              <div className="confirm-vs">{t("common.vs")}</div>

              <div className="confirm-team">
                <h3>{awayTeam}</h3>
                <span className="confirm-label">{t("common.away")}</span>
                <p>{t("create_match.players_count", { count: awayPlayers.length })}</p>
              </div>
            </div>

          </div>

          <div className="step-actions">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              {t("create_match.back")}
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreate}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <IconStadium />
              <span>{t("create_match.create_match_btn")}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

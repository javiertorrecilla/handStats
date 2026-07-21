import { useState, useEffect } from "react";
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
  const [step, setStep] = useState(1);

  // Paso 1 — Equipos
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");

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
      setHomePlayers(mappedPlayers);
      setShowHomeSuggestions(false);
    } else {
      setAwayTeam(team.name);
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
        // Si el equipo está guardado, buscar si el jugador existía para heredar su rol
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
        // Si no está en equipo guardado, usar heurística estándar (1, 12, 16)
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
      home_players: homePlayers,
      away_players: awayPlayers,
    });
  };

  return (
    <div className="create-match-page">

      <div className="create-match-header">
        <h2 style={{ display: "flex", alignItems: "center" }}>
          <IconHandball />
          <span>Nuevo Partido</span>
        </h2>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      {/* STEPPER */}
      <div className="stepper">
        <div className={`stepper-step ${step >= 1 ? "active" : ""}`}>
          <div className="stepper-circle">1</div>
          <span>Equipos</span>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-step ${step >= 2 ? "active" : ""}`}>
          <div className="stepper-circle">2</div>
          <span>Jugadores</span>
        </div>
        <div className="stepper-line" />
        <div className={`stepper-step ${step >= 3 ? "active" : ""}`}>
          <div className="stepper-circle">3</div>
          <span>Confirmar</span>
        </div>
      </div>

      {/* PASO 1 — EQUIPOS */}
      {step === 1 && (
        <div className="step-content">

          <div className="teams-form">

            <div className="team-input-group">
              <label>Equipo Local</label>
              <div className="autocomplete-wrapper">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Ej. BM Málaga"
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
                    {getFilteredTeams(homeTeam).map((t, i) => (
                      <button
                        key={i}
                        className="autocomplete-item"
                        onMouseDown={() => selectSavedTeam(t, "home")}
                      >
                        {t.name}
                        <span className="autocomplete-badge">
                          {t.players?.length || 0} jugadores
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div className="team-input-group">
              <label>Equipo Visitante</label>
              <div className="autocomplete-wrapper">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Ej. CB Torremolinos"
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
                    {getFilteredTeams(awayTeam).map((t, i) => (
                      <button
                        key={i}
                        className="autocomplete-item"
                        onMouseDown={() => selectSavedTeam(t, "away")}
                      >
                        {t.name}
                        <span className="autocomplete-badge">
                          {t.players?.length || 0} jugadores
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
              ¿Tienes el acta en PDF? Sube el archivo y se extraerán los equipos y jugadores automáticamente.
            </p>
            <PdfUploader onParsed={handlePdfParsed} />
          </div>

          <div className="step-actions">
            <button
              className="btn btn-primary"
              disabled={!canGoStep2}
              onClick={() => setStep(2)}
            >
              Siguiente →
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
              ← Atrás
            </button>
            <button
              className="btn btn-primary"
              disabled={!canCreate}
              onClick={() => setStep(3)}
            >
              Siguiente →
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
                <span className="confirm-label">Local</span>
                <p>{homePlayers.length} jugadores</p>
              </div>

              <div className="confirm-vs">VS</div>

              <div className="confirm-team">
                <h3>{awayTeam}</h3>
                <span className="confirm-label">Visitante</span>
                <p>{awayPlayers.length} jugadores</p>
              </div>
            </div>

          </div>

          <div className="step-actions">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Atrás
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreate}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <IconStadium />
              <span>Crear Partido</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

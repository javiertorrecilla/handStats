import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { useMatch } from "./context/MatchContext";

import { matchService } from "./services/handstatsService";
import userService from "./services/userService";

import AuthPage from "./components/auth/AuthPage";
import LandingPage from "./components/landing/LandingPage";
import Sidebar from "./components/layout/SideBar";
import MatchesPage from "./components/match/MatchesPage";
import CreateMatchPage from "./components/match/CreateMatchPage";
import TeamsPage from "./components/team/TeamsPage";
import SettingsPage from "./components/settings/SettingsPage";
import MatchAnalysisPage from "./components/match/MatchAnalysisPage";

/**
 * Componente contenedor de ruta para el análisis y mesa de control de un partido.
 * Permite cargar el partido directamente por ID desde la URL (/matches/:matchId o /matches/:matchId/stats),
 * asegurando persistencia ante recargas de página o navegación directa.
 */
function MatchAnalysisRoute({ user, theme, toggleTheme, onUpdateMatchEvents }) {
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentMatch, loadMatch } = useMatch();
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const initialMode = location.pathname.endsWith("/stats") ? "stats" : "live";

  useEffect(() => {
    if (!matchId) return;
    const isAlreadyLoaded = Boolean(
      currentMatch && (String(currentMatch._id) === String(matchId) || String(currentMatch.id) === String(matchId))
    );
    if (!isAlreadyLoaded) {
      setLoadingMatch(true);
      setLoadError(null);
      loadMatch(matchId)
        .catch((err) => {
          console.error("Error al cargar partido desde la ruta:", err);
          setLoadError(err?.message || "No se pudo cargar el partido");
        })
        .finally(() => {
          setLoadingMatch(false);
        });
    }
  }, [matchId, currentMatch, loadMatch]);

  if (loadingMatch && !currentMatch) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--text-primary)"
        }}
      >
        Cargando partido...
      </div>
    );
  }

  if (loadError && !currentMatch) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: "20px"
        }}
      >
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
            Partido no encontrado
          </h3>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", marginBottom: "20px" }}>
            El partido solicitado no existe o no se pudo cargar.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/matches")}>
            Volver a mis partidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <MatchAnalysisPage
      currentMatch={currentMatch}
      onUpdateMatchEvents={onUpdateMatchEvents}
      user={user}
      initialMode={initialMode}
      onBack={() => navigate("/matches")}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    loginAsGuest,
    logout,
    guestMatches,
    incrementGuestMatches,
  } = useAuth();

  const {
    currentMatch,
    setCurrentMatch,
    loadMatch,
  } = useMatch();

  // --------------------------------------------------
  // TEMA (CLARO / OSCURO)
  // --------------------------------------------------

  const getInitialTheme = () => {
    const saved = localStorage.getItem("hs_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hs_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // --------------------------------------------------
  // ESTADOS Y CARGA DE DATOS
  // --------------------------------------------------

  const [matchesList, setMatchesList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    try {
      if (user.role === "guest") {
        setMatchesList([]);
      } else {
        const userId = user.firebase_uid || user.uid;
        const matches = await matchService.getByUser(userId);
        setMatchesList(matches || []);
      }
    } catch (err) {
      console.error("Error cargando partidos:", err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchMatches();
  }, [user, fetchMatches]);

  // --------------------------------------------------
  // MANEJADORES DE ACCIONES DE PARTIDO
  // --------------------------------------------------

  const handleMatchCreated = async (matchData) => {
    if (user.role === "guest" && guestMatches >= 3) {
      return alert("Has alcanzado el límite de partidos para invitados.");
    }

    const userId = user.firebase_uid || user.uid;

    const payload = {
      user_id: userId,
      home_team: matchData.home_team,
      away_team: matchData.away_team,
      home_players: matchData.home_players.filter(p => p.selected !== false).map(({ name, number, is_goalkeeper }) => ({ name, number, is_goalkeeper: is_goalkeeper || false })),
      away_players: matchData.away_players.filter(p => p.selected !== false).map(({ name, number, is_goalkeeper }) => ({ name, number, is_goalkeeper: is_goalkeeper || false })),
      goals_home: 0,
      goals_away: 0,
      events: [],
      possessions: [],
    };

    try {
      const created = await matchService.create(payload);

      setMatchesList((prev) => [created, ...prev]);
      navigate("/matches");

      if (user.role === "guest") {
        incrementGuestMatches();
      }

      // Guardar equipos para futuros usos (solo usuarios registrados si no existen ya)
      if (user.role !== "guest" && user._id) {
        try {
          const savedTeams = await userService.getSavedTeams(user._id);
          const savedTeamsLower = (savedTeams || []).map((t) => t.name.toLowerCase());

          if (
            matchData.home_players.length > 0 &&
            !savedTeamsLower.includes(matchData.home_team.toLowerCase())
          ) {
            await userService.saveTeam(user._id, {
              name: matchData.home_team,
              players: matchData.home_players.map(({ name, number, is_goalkeeper }) => ({ name, number, is_goalkeeper: is_goalkeeper || false })),
            });
          }
          if (
            matchData.away_players.length > 0 &&
            !savedTeamsLower.includes(matchData.away_team.toLowerCase())
          ) {
            await userService.saveTeam(user._id, {
              name: matchData.away_team,
              players: matchData.away_players.map(({ name, number, is_goalkeeper }) => ({ name, number, is_goalkeeper: is_goalkeeper || false })),
            });
          }
        } catch (err) {
          console.log("No se pudieron guardar los equipos:", err);
        }
      }

    } catch (err) {
      console.error(err);
      alert("Error al crear el partido.");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm("¿Eliminar este partido?")) return;

    try {
      await matchService.delete(matchId);
      setMatchesList((prev) => prev.filter((m) => m._id !== matchId));

      if (currentMatch?._id === matchId) {
        setCurrentMatch(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el partido.");
    }
  };

  const handleLoadMatch = async (matchId, initialMode = "live") => {
    try {
      await loadMatch(matchId);
    } catch (err) {
      console.error("Error al cargar partido:", err);
    }
    if (initialMode === "stats") {
      navigate(`/matches/${matchId}/stats`);
    } else {
      navigate(`/matches/${matchId}`);
    }
  };

  const handleUpdateMatchEvents = async (updatedMatch) => {
    setCurrentMatch(updatedMatch);
    setMatchesList((prev) => {
      const list = prev || [];
      const idx = list.findIndex(
        (m) =>
          (m && m._id && updatedMatch._id && m._id === updatedMatch._id) ||
          (m && m.id && updatedMatch.id && m.id === updatedMatch.id)
      );
      if (idx >= 0) {
        const updated = [...list];
        updated[idx] = updatedMatch;
        return updated;
      }
      return [updatedMatch, ...list];
    });
    try {
      if (updatedMatch?._id) {
        await matchService.update(updatedMatch._id, updatedMatch);
      }
    } catch (err) {
      console.error("Error al actualizar evento de partido:", err);
    }
  };

  // --------------------------------------------------
  // RENDERIZADO: CARGA Y AUTENTICACIÓN
  // --------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          fontSize: "22px",
          fontWeight: 600,
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          theme={theme}
          toggleTheme={toggleTheme}
          onTryApp={() => setShowLanding(false)}
        />
      );
    }

    return (
      <AuthPage
        login={login}
        register={register}
        loginWithGoogle={loginWithGoogle}
        loginAsGuest={loginAsGuest}
        theme={theme}
        toggleTheme={toggleTheme}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  // --------------------------------------------------
  // RENDERIZADO PRINCIPAL CON RUTAS
  // --------------------------------------------------

  const isAnalyzeView = location.pathname.startsWith("/matches/") && location.pathname !== "/matches/new";

  return (
    <div className="app-layout">
      {!isAnalyzeView && (
        <Sidebar
          user={user}
          guestMatches={guestMatches}
          logout={logout}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      <main
        className="app-main"
        style={isAnalyzeView ? { marginLeft: 0, width: "100%", padding: 0, minHeight: "100vh" } : {}}
      >
        {loadingData && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 8,
              background: "var(--color-primary-subtle)",
              color: "var(--color-primary)",
              fontWeight: 600,
            }}
          >
            Sincronizando datos...
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/matches" replace />} />
          <Route
            path="/matches"
            element={
              <MatchesPage
                matchesList={matchesList}
                loadMatch={handleLoadMatch}
                currentMatch={currentMatch}
                onCreateNew={() => navigate("/matches/new")}
                onDeleteMatch={handleDeleteMatch}
                isGuest={user.role === "guest"}
                guestMatches={guestMatches}
              />
            }
          />
          <Route
            path="/matches/new"
            element={
              <CreateMatchPage
                user={user}
                onMatchCreated={handleMatchCreated}
                onCancel={() => navigate("/matches")}
              />
            }
          />
          <Route
            path="/matches/:matchId"
            element={
              <MatchAnalysisRoute
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                onUpdateMatchEvents={handleUpdateMatchEvents}
              />
            }
          />
          <Route
            path="/matches/:matchId/stats"
            element={
              <MatchAnalysisRoute
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                onUpdateMatchEvents={handleUpdateMatchEvents}
              />
            }
          />
          <Route
            path="/teams"
            element={
              user.role === "guest" ? (
                <Navigate to="/matches" replace />
              ) : (
                <TeamsPage user={user} matchesList={matchesList} />
              )
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage matchesList={matchesList} currentMatch={currentMatch} />
            }
          />
          <Route path="*" element={<Navigate to="/matches" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
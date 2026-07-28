import React, { useState, useEffect } from "react";

import { useAuth } from "./context/AuthContext";
import { useMatch } from "./context/MatchContext";

import { matchService } from "./services/handstatsService";
import userService from "./services/userService";

import AuthPage from "./components/auth/AuthPage";
import Sidebar from "./components/layout/SideBar";
import MatchesPage from "./components/match/MatchesPage";
import CreateMatchPage from "./components/match/CreateMatchPage";
import TeamsPage from "./components/team/TeamsPage";
import SettingsPage from "./components/settings/SettingsPage";
import MatchAnalysisPage from "./components/match/MatchAnalysisPage";

function App() {
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
  // ESTADOS
  // --------------------------------------------------

  const [view, setView] = useState("list"); // "list" | "create" | "teams" | "settings" | "analyze"
  const [initialAnalyzeMode, setInitialAnalyzeMode] = useState("live");
  const [matchesList, setMatchesList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // --------------------------------------------------
  // CARGA DE PARTIDOS
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;
    if (view !== "list") return;

    const fetchMatches = async () => {
      setLoadingData(true);

      try {
        if (user.role === "guest") {
          // Los invitados no tienen partidos guardados en BD
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
    };

    fetchMatches();
  }, [user, view]);

  // --------------------------------------------------
  // LOGIN
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
    return (
      <AuthPage
        login={login}
        register={register}
        loginWithGoogle={loginWithGoogle}
        loginAsGuest={loginAsGuest}
      />
    );
  }

  // --------------------------------------------------
  // CREAR PARTIDO
  // --------------------------------------------------

  const handleMatchCreated = async (matchData) => {
    if (
      user.role === "guest" &&
      guestMatches >= 3
    ) {
      return alert(
        "Has alcanzado el límite de partidos para invitados."
      );
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
      setView("list");

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

  // --------------------------------------------------
  // ELIMINAR PARTIDO
  // --------------------------------------------------

  const handleDeleteMatch = async (matchId) => {
    if (!confirm("¿Eliminar este partido?")) return;

    try {
      await matchService.delete(matchId);
      setMatchesList((prev) =>
        prev.filter((m) => m._id !== matchId)
      );

      if (currentMatch?._id === matchId) {
        setCurrentMatch(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el partido.");
    }
  };

  const handleLoadMatch = async (matchId, initialMode = "live") => {
    await loadMatch(matchId);
    setInitialAnalyzeMode(initialMode || "live");
    setView("analyze");
  };

  return (
    <div className="app-layout">
      {view !== "analyze" && (
        <Sidebar
          user={user}
          guestMatches={guestMatches}
          logout={logout}
          view={view}
          setView={setView}
        />
      )}

      <main className="app-main" style={view === "analyze" ? { marginLeft: 0, width: "100%", padding: "20px" } : {}}>
        {loadingData && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(37,99,235,.08)",
              color: "var(--accent-primary)",
              fontWeight: 600,
            }}
          >
            Sincronizando datos...
          </div>
        )}

        {view === "create" ? (
          <CreateMatchPage
            user={user}
            onMatchCreated={handleMatchCreated}
            onCancel={() => setView("list")}
          />
        ) : view === "teams" ? (
          <TeamsPage
            user={user}
            matchesList={matchesList}
          />
        ) : view === "settings" ? (
          <SettingsPage matchesList={matchesList} />
        ) : view === "analyze" ? (
          <MatchAnalysisPage
            currentMatch={currentMatch}
            onUpdateMatchEvents={async (updatedMatch) => {
              setCurrentMatch(updatedMatch);
              try {
                if (updatedMatch?._id) {
                  await matchService.update(updatedMatch._id, updatedMatch);
                }
              } catch (err) {
                console.error("Error al actualizar evento de partido:", err);
              }
            }}
            user={user}
            initialMode={initialAnalyzeMode}
            onBack={() => setView("list")}
          />
        ) : (
          <MatchesPage
            matchesList={matchesList}
            loadMatch={handleLoadMatch}
            currentMatch={currentMatch}
            onCreateNew={() => setView("create")}
            onDeleteMatch={handleDeleteMatch}
            isGuest={user.role === "guest"}
            guestMatches={guestMatches}
          />
        )}
      </main>
    </div>
  );
}

export default App;
import React, { createContext, useContext, useState } from 'react';
import { matchService } from '../services/handstatsService';

const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePossession, setActivePossession] = useState({
    possession_number: 1,
    team: 'LOCAL', 
    start_time: 0,
    phase: 'Posicional',
    situation: 'Igualdad'
  });

  // Carga el partido en el estado de la mesa de anotación
  const loadMatch = async (matchId) => {
    setLoading(true);
    try {
      const match = await matchService.getById(matchId);
      setCurrentMatch(match);
      
      if (match.possessions && match.possessions.length > 0) {
        const nextNum = Math.max(...match.possessions.map(p => p.possession_number)) + 1;
        setActivePossession(prev => ({ ...prev, possession_number: nextNum }));
      }
    } catch (error) {
      console.error("Error cargando el partido en el contexto:", error);
    } finally {
      setLoading(false);
    }
  };

  // Envía un evento a FastAPI y actualiza la UI de forma optimista
  const sendMatchEvent = async (eventData, matchTimeSeconds) => {
    if (!currentMatch) return;

    const fullEvent = {
      ...eventData,
      match_time_seconds: matchTimeSeconds,
      possession_number: activePossession.possession_number,
      play_phase: activePossession.phase,
      numerical_situation: activePossession.situation,
    };

    try {
      await matchService.addEvent(currentMatch._id, fullEvent);

      setCurrentMatch(prev => {
        const updatedEvents = [...prev.events, fullEvent];
        let goalsHome = prev.goals_home;
        let goalsAway = prev.goals_away;

        if (fullEvent.event_type === 'shot' && fullEvent.result === 'Gol') {
          if (fullEvent.is_opponent_action) {
            goalsAway += 1;
          } else {
            goalsHome += 1;
          }
        }

        return {
          ...prev,
          events: updatedEvents,
          goals_home: goalsHome,
          goals_away: goalsAway
        };
      });
    } catch (error) {
      console.error("Error al registrar el evento en el servidor:", error);
    }
  };

  // Cierra el ataque o defensa actual y rota la posesión
  const closePossession = async (endTime, endReason, overrideNextTeam = null) => {
    if (!currentMatch) return;

    const duration = Math.max(0, endTime - activePossession.start_time);
    const finalPossession = {
      ...activePossession,
      end_time: endTime,
      duration: duration,
      duration_seconds: duration,
      end_reason: endReason
    };

    try {
      await matchService.addPossession(currentMatch._id, finalPossession);
      
      setCurrentMatch(prev => ({
        ...prev,
        possessions: [...prev.possessions, finalPossession]
      }));

      setActivePossession(prev => ({
        possession_number: prev.possession_number + 1,
        team: overrideNextTeam !== null ? overrideNextTeam : (prev.team === 'LOCAL' ? 'VISITANTE' : 'LOCAL'),
        start_time: endTime,
        phase: 'Posicional',
        situation: 'Igualdad'
      }));
    } catch (error) {
      console.error("Error al cerrar la posesión en el servidor:", error);
    }
  };

  // Deshacer el último evento
  const undoLastEvent = async () => {
    if (!currentMatch) return;
    try {
      const updated = await matchService.undoLastEvent(currentMatch._id);
      setCurrentMatch(updated);
    } catch (error) {
      console.error("Error al deshacer el último evento:", error);
      alert(error.response?.data?.detail || "No se pudo deshacer la acción");
    }
  };

  return (
    <MatchContext.Provider value={{
      currentMatch,
      loading,
      activePossession,
      setActivePossession,
      loadMatch,
      sendMatchEvent,
      closePossession,
      undoLastEvent,
      setCurrentMatch
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
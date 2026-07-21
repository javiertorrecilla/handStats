import api from "./api";

/* ==========================================================
   MATCHES
========================================================== */

export const matchService = {
  create: async (matchData) =>
    (await api.post("/matches/", matchData)).data,

  getById: async (id) =>
    (await api.get(`/matches/${id}`)).data,

  getByUser: async (userId) =>
    (await api.get(`/matches/user/${userId}`)).data,

  delete: async (id) =>
    (await api.delete(`/matches/${id}`)).data,

  updatePlayers: async (id, homePlayers, awayPlayers) =>
    (await api.put(`/matches/${id}/players`, {
      home_players: homePlayers,
      away_players: awayPlayers,
    })).data,

  addEvent: async (id, eventData) =>
    (await api.post(`/matches/${id}/events`, eventData)).data,

  addPossession: async (id, possessionData) =>
    (await api.post(`/matches/${id}/possessions`, possessionData)).data,

  undoLastEvent: async (id) =>
    (await api.post(`/matches/${id}/undo`)).data,
};

/* ==========================================================
   PDF
========================================================== */

export const pdfService = {
  parseActa: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return (
      await api.post("/pdf/parse-acta", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  },
};
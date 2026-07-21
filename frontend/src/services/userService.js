import api from "./api";

const userService = {

    create: async (data) => {
        const res = await api.post("/users/", data);
        return res.data;
    },

    getByFirebaseUid: async (uid) => {
        const res = await api.get(`/users/firebase/${uid}`);
        return res.data;
    },

    getSavedTeams: async (userId) => {
        const res = await api.get(`/users/${userId}/saved-teams`);
        return res.data;
    },

    saveTeam: async (userId, team) => {
        const res = await api.post(`/users/${userId}/saved-teams`, team);
        return res.data;
    },

    deleteSavedTeam: async (userId, teamName) => {
        const res = await api.delete(
            `/users/${userId}/saved-teams/${encodeURIComponent(teamName)}`
        );
        return res.data;
    },

    updateSavedTeam: async (userId, teamName, team) => {
        const res = await api.put(
            `/users/${userId}/saved-teams/${encodeURIComponent(teamName)}`,
            team
        );
        return res.data;
    },

};

export default userService;
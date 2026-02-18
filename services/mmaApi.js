const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.mma.api-sports.io";

/* ================== MATCH LIST ================== */
async function getMmaMatches() {
    if (!API_KEY) return [];

    try {
        const res = await axios.get(`${BASE_URL}/fights`, {
            headers: { "x-apisports-key": API_KEY }
        });

        const fights = res.data?.response || [];

        return fights.map(f => ({
            externalMatchId: `mma_${f.id}`,
            sport: "mma",
            league: f.league?.name || "MMA",
            team1: f.fighters?.red?.name,
            team2: f.fighters?.blue?.name,
            team1Logo: f.fighters?.red?.logo,
            team2Logo: f.fighters?.blue?.logo,
            leagueLogo: f.league?.logo,
            startTime: f.date,
            status: f.status === "live" ? "live" : "upcoming",
            bettingOpen: isBettingOpen(f.date)
        }));

    } catch (err) {
        console.error("MMA API error:", err.message);
        return [];
    }
}

/* ================== RESULT FETCH ================== */
async function getMmaResults() {
    // Can be implemented later (winner endpoint)
    return [];
}

/* ================== HELPERS ================== */
function normalizeStatus(code) {
    if (!code) return "upcoming";

    if (["FT", "AOT", "FINISHED"].includes(code)) return "finished";
    if (["LIVE", "Q1", "Q2", "Q3", "Q4", "OT"].includes(code)) return "live";
    return "upcoming";
}

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

module.exports = {
    getMmaMatches,
    getMmaResults
};

const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.mma.api-sports.io";

/* ================== MATCH LIST ================== */
async function getMmaMatches() {
    if (!API_KEY) return [];

    const today = new Date().toISOString().slice(0, 10);

    const res = await axios.get(`${BASE_URL}/fights`, {
        headers: { "x-apisports-key": API_KEY },
        params: { date: today }
    });

    const fights = res.data?.response || [];

    return fights.map(f => ({
        externalMatchId: `mma_${f.fights.id}`,
        sport: "mma",
        league: f.league?.name || "MMA",
        country: f.country || "International",
        tournament: f.league?.name || "Fight Night",
        team1: f.fighters?.red?.name || "Red Corner",
        team2: f.fighters?.blue?.name || "Blue Corner",
        team1Logo: f.fighters?.red?.logo || null,
        team2Logo: f.fighters?.blue?.logo || null,
        leagueLogo: f.league?.logo || null,
        startTime: f.fights?.date,
        status: normalizeStatus(f.fights?.status?.short),
        bettingOpen: isBettingOpen(f.fights?.date)
    }));
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
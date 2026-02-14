const axios = require("axios");
const { getLogo } = require("../utils/logoMap");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.basketball.api-sports.io";

/* ================== MATCH LIST ================== */
async function getBasketballMatches() {
    if (!API_KEY) return [];

    const today = new Date().toISOString().slice(0, 10);

    const res = await axios.get(`${BASE_URL}/games`, {
        headers: { "x-apisports-key": API_KEY },
        params: { date: today }
    });

    const games = res.data?.response || [];

    return games.map(g => ({
        externalMatchId: `basketball_${g.id}`,
        sport: "basketball",
        league: g.league?.name || "Basketball",
        country: g.country?.name || "International",
        tournament: g.league?.name || "Basketball",
        team1: g.teams?.home?.name || "Home",
        team2: g.teams?.away?.name || "Away",
        team1Logo: g.teams?.home?.logo || null,
        team2Logo: g.teams?.away?.logo || null,
        leagueLogo: g.league?.logo || null,
        startTime: g.date,
        status: normalizeStatus(g.status?.short),
        bettingOpen: isBettingOpen(g.date)
    }));
}

/* ================== RESULT FETCH ================== */
async function getBasketballResults() {
    // Phase 5+ (safe empty)
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
    getBasketballMatches,
    getBasketballResults
};

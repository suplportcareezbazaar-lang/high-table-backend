const axios = require("axios");
const { getLogo } = require("../utils/logoMap");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.basketball.api-sports.io";

/* ================== MATCH LIST ================== */
async function getBasketballMatches() {
    if (!API_KEY) return [];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = d => d.toISOString().slice(0, 10);

    try {
        const [todayRes, tomorrowRes] = await Promise.all([
            axios.get(`${BASE_URL}/games`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(today) }
            }),
            axios.get(`${BASE_URL}/games`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(tomorrow) }
            })
        ]);

        const games = [
            ...(todayRes.data?.response || []),
            ...(tomorrowRes.data?.response || [])
        ];

        return games.map(g => ({
            externalMatchId: `basketball_${g.id}`,
            sport: "basketball",
            league: g.league?.name || "Basketball",
            team1: g.teams?.home?.name,
            team2: g.teams?.away?.name,
            team1Logo: g.teams?.home?.logo,
            team2Logo: g.teams?.away?.logo,
            leagueLogo: g.league?.logo,
            startTime: g.date,
            status: mapBasketStatus(g.status?.short),
            bettingOpen: isBettingOpen(g.date)
        }));

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

function mapBasketStatus(code) {
    if (!code) return "upcoming";
    if (["FT"].includes(code)) return "finished";
    if (["Q1","Q2","Q3","Q4","OT","LIVE"].includes(code)) return "live";
    return "upcoming";
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

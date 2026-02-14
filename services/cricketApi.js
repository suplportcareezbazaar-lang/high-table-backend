const axios = require("axios");
const { getLogo } = require("../utils/logoMap");

const CRICAPI_KEY = process.env.CRICAPI_KEY;

/* ================== MATCH LIST ================== */
async function getCricketMatches() {
    if (!CRICAPI_KEY) {
        console.error("❌ CRICAPI_KEY missing");
        return [];
    }

    try {
        const res = await axios.get(
            "https://api.cricapi.com/v1/matches",
            {
                params: { apikey: CRICAPI_KEY, offset: 0 },
                timeout: 15000
            }
        );

        // ✅ HARD GUARD (prevents map crash)
        const matches = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        return matches.map(m => ({
            externalMatchId: `cricket_${m.id}`,
            sport: "cricket",
            league: m.series || "Cricket",
            country: m.country || "International",
            tournament: m.series || "Cricket",
            team1: m.teamInfo?.[0]?.name || "Team A",
            team2: m.teamInfo?.[1]?.name || "Team B",
            team1Logo: getLogo(m.teamInfo?.[0]?.name),
            team2Logo: getLogo(m.teamInfo?.[1]?.name),
            startTime: m.dateTimeGMT,
            status: normalizeStatus(m.status, m.dateTimeGMT),
            bettingOpen: isBettingOpen(m.dateTimeGMT)
        }));

    } catch (err) {
        console.error("❌ CricAPI error:", err.message);
        return [];
    }
}

/* ================== RESULT FETCH ================== */
async function getCricketResults() {
    if (!CRICAPI_KEY) return [];

    try {
        const res = await axios.get(
            "https://api.cricapi.com/v1/currentMatches",
            {
                params: { apikey: CRICAPI_KEY },
                timeout: 15000
            }
        );

        const matches = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        return matches
            .filter(m =>
                /finished|completed|result/i.test(m.status) &&
                m.winner_team
            )
            .map(m => ({
                externalMatchId: `cricket_${m.id}`,
                winner: m.winner_team
            }));

    } catch (err) {
        console.error("❌ Cricket result error:", err.message);
        return [];
    }
}

/* ================== HELPERS ================== */
function normalizeStatus(apiStatus, startTime) {
    if (!startTime) return "upcoming";

    const now = new Date();
    const matchTime = new Date(startTime);
    const status = (apiStatus || "").toLowerCase();

    if (status.includes("live") || status.includes("playing")) return "live";
    if (status.includes("finished") || status.includes("completed") || status.includes("result"))
        return "finished";

    if (matchTime > now) return "upcoming";

    return "finished";
}

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

module.exports = {
    getCricketMatches,
    getCricketResults
};

const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

/* ================== MATCH LIST ================== */
async function getFootballMatches() {
    if (!API_KEY) return [];

    const today = new Date().toISOString().slice(0, 10);

    const res = await axios.get(`${BASE_URL}/fixtures`, {
        headers: { "x-apisports-key": API_KEY },
        params: { date: today }
    });

    const fixtures = res.data?.response || [];

    return fixtures.map(f => ({
        externalMatchId: `football_${f.fixture.id}`,
        sport: "football",
        league: f.league?.name || "Football",
        country: f.league?.country || "International",
        tournament: f.league?.name || "Football",
        team1: f.teams?.home?.name || "Home",
        team2: f.teams?.away?.name || "Away",
        team1Logo: f.teams?.home?.logo || null,
        team2Logo: f.teams?.away?.logo || null,
        leagueLogo: f.league?.logo || null,
        startTime: f.fixture?.date,
        status: normalizeStatus(f.fixture?.status?.short),
        bettingOpen: isBettingOpen(f.fixture?.date)
    }));
}

/* ================== RESULTS ================== */
async function getFootballResults() {
    if (!API_KEY) return [];

    try {
        const res = await axios.get(`${BASE_URL}/fixtures`, {
            headers: { "x-apisports-key": API_KEY },
            params: {
                last: 50 // recent finished matches
            },
            timeout: 15000
        });

        const fixtures = res.data?.response || [];

        return fixtures
            .filter(f =>
                ["FT", "AET", "PEN"].includes(f.fixture?.status?.short)
            )
            .map(f => ({
                externalMatchId: `football_${f.fixture.id}`,
                winner:
                    f.teams?.home?.winner
                        ? f.teams.home.name
                        : f.teams?.away?.winner
                            ? f.teams.away.name
                            : "draw"
            }));

    } catch (err) {
        console.error("❌ Football results error:", err.message);
        return [];
    }
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
    getFootballMatches,
    getFootballResults
};
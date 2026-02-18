const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

/* ================== MATCH LIST ================== */
async function getFootballMatches() {
    if (!API_KEY) return [];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = d => d.toISOString().slice(0, 10);

    try {
        const [todayRes, tomorrowRes] = await Promise.all([
            axios.get(`${BASE_URL}/fixtures`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(today) }
            }),
            axios.get(`${BASE_URL}/fixtures`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(tomorrow) }
            })
        ]);

        const fixtures = [
            ...(todayRes.data?.response || []),
            ...(tomorrowRes.data?.response || [])
        ];

        return fixtures.map(f => ({
            externalMatchId: `football_${f.fixture.id}`,
            sport: "football",
            league: f.league?.name || "Football",
            team1: f.teams?.home?.name,
            team2: f.teams?.away?.name,
            team1Logo: f.teams?.home?.logo,
            team2Logo: f.teams?.away?.logo,
            leagueLogo: f.league?.logo,
            startTime: f.fixture?.date,
            status: mapFootballStatus(f.fixture?.status?.short),
            bettingOpen: isBettingOpen(f.fixture?.date)
        }));

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

function mapFootballStatus(code) {
    if (!code) return "upcoming";

    if (["FT", "AET", "PEN"].includes(code)) return "finished";
    if (["1H", "2H", "LIVE", "ET", "BT"].includes(code)) return "live";

    return "upcoming";
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

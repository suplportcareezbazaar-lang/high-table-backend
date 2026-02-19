const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

function mapFootballStatus(code) {
    if (!code) return "upcoming";
    if (["FT", "AET", "PEN"].includes(code)) return "finished";
    if (["1H", "2H", "LIVE", "ET", "BT"].includes(code)) return "live";
    return "upcoming";
}

async function getFootballMatches() {
    if (!API_KEY) return [];

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = d => d.toISOString().slice(0, 10);

    try {
        const responses = await Promise.all([
            axios.get(`${BASE_URL}/fixtures`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(today) }
            }),
            axios.get(`${BASE_URL}/fixtures`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(tomorrow) }
            })
        ]);

        const fixtures = responses.flatMap(r => r.data?.response || []);

        return fixtures.map(f => {
            const id = `football_${f.fixture.id}`;

            return {
                id,
                externalMatchId: id,
                sport: "football",
                league: f.league?.name || "Football",
                team1: f.teams?.home?.name,
                team2: f.teams?.away?.name,
                team1Logo: f.teams?.home?.logo,
                team2Logo: f.teams?.away?.logo,
                startTime: f.fixture?.date,
                status: mapFootballStatus(f.fixture?.status?.short),
                bettingOpen: isBettingOpen(f.fixture?.date)
            };
        });

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

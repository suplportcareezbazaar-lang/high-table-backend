const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.basketball.api-sports.io";

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

function mapBasketStatus(code) {
    if (!code) return "upcoming";
    if (["FT"].includes(code)) return "finished";
    if (["Q1","Q2","Q3","Q4","OT","LIVE"].includes(code)) return "live";
    return "upcoming";
}

async function getBasketballMatches() {
    if (!API_KEY) return [];

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = d => d.toISOString().slice(0, 10);

    try {
        const responses = await Promise.all([
            axios.get(`${BASE_URL}/games`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(today) }
            }),
            axios.get(`${BASE_URL}/games`, {
                headers: { "x-apisports-key": API_KEY },
                params: { date: formatDate(tomorrow) }
            })
        ]);

        const games = responses.flatMap(r => r.data?.response || []);

        return games.map(g => {
            const id = `basketball_${g.id}`;

            return {
                id,
                externalMatchId: id,
                sport: "basketball",
                league: g.league?.name || "Basketball",
                team1: g.teams?.home?.name,
                team2: g.teams?.away?.name,
                team1Logo: g.teams?.home?.logo,
                team2Logo: g.teams?.away?.logo,
                startTime: g.date,
                status: mapBasketStatus(g.status?.short),
                bettingOpen: isBettingOpen(g.date)
            };
        });

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

module.exports = { getBasketballMatches };

const axios = require("axios");

const API_KEY = process.env.API_SPORTS_KEY;
const BASE_URL = "https://v1.mma.api-sports.io";

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

async function getMmaMatches() {
    if (!API_KEY) return [];

    try {
        const response = await axios.get(`${BASE_URL}/fights`, {
            headers: { "x-apisports-key": API_KEY }
        });

        const fights = response.data?.response || [];

        const filtered = fights.filter(f =>
            f.league?.name?.toLowerCase().includes("ufc")
        );

        console.log("MMA important fights:", filtered.length);

        return filtered.map(f => {
            const id = `mma_${f.id}`;

            return {
                id,
                externalMatchId: id,
                sport: "mma",
                league: f.league?.name || "MMA",
                team1: f.fighters?.home?.name,
                team2: f.fighters?.away?.name,
                team1Logo: null,
                team2Logo: null,
                startTime: f.date,
                status: "upcoming",
                bettingOpen: isBettingOpen(f.date)
            };
        });

    } catch (err) {
        console.error("MMA API error:", err.message);
        return [];
    }
}

module.exports = { getMmaMatches };

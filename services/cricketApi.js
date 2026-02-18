const axios = require("axios");

const CRICAPI_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

/* ================== MATCH LIST ================== */
async function getCricketMatches() {
    if (!CRICAPI_KEY) {
        console.error("❌ CRICAPI_KEY missing");
        return [];
    }

    try {
        const res = await axios.get(`${BASE_URL}/matches`, {
            params: {
                apikey: CRICAPI_KEY,
                offset: 0
            },
            timeout: 15000
        });

        if (res.data?.status !== "success") {
            console.error("❌ CricAPI returned error");
            return [];
        }

        const matches = Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        const now = Date.now();
        const next24h = now + 24 * 60 * 60 * 1000;

        return matches
            .filter(m => m.dateTimeGMT)
            .map(m => {
                const start = new Date(m.dateTimeGMT).getTime();
                const isLive = /live|playing/i.test(m.status || "");

                return {
                    externalMatchId: `cricket_${m.id}`,
                    sport: "cricket",
                    league: m.series || "Cricket",
                    team1: m.teams?.[0] || "Team A",
                    team2: m.teams?.[1] || "Team B",
                    startTime: m.dateTimeGMT,
                    status: isLive
                        ? "live"
                        : start > now && start <= next24h
                            ? "upcoming"
                            : "ignore",
                    team1Logo: null,
                    team2Logo: null,
                    leagueLogo: null
                };
            })
            .filter(m => m.status !== "ignore");

    } catch (err) {
        console.error("❌ CricAPI error:", err.message);
        return [];
    }
}

/* ================== RESULTS ================== */
async function getCricketResults() {
    return [];
}

module.exports = {
    getCricketMatches,
    getCricketResults
};

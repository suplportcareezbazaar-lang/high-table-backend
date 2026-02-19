const axios = require("axios");

const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1/currentMatches";

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        const res = await axios.get(BASE_URL, {
            params: {
                apikey: API_KEY,
                offset: 0
            },
            timeout: 10000
        });

        if (res.data.status !== "success") {
            console.error("CricAPI failed:", res.data);
            return [];
        }

        const matches = res.data.data || [];
        const now = Date.now();

        return matches
            .filter(m => m.dateTimeGMT && m.teams?.length === 2)
            .map(m => {
                const start = new Date(m.dateTimeGMT).getTime();

                let status = "upcoming";

                if (
                    m.status &&
                    !/finished|completed|result/i.test(m.status) &&
                    start <= now
                ) {
                    status = "live";
                }

                return {
                    externalMatchId: `cricket_${m.id}`,
                    sport: "cricket",
                    league: m.series || "Cricket",
                    team1: m.teams[0],
                    team2: m.teams[1],
                    startTime: m.dateTimeGMT,
                    status,
                    bettingOpen: status === "upcoming",
                    team1Logo: null,
                    team2Logo: null,
                    leagueLogo: null
                };
            });

    } catch (err) {
        console.error("CricAPI error:", err.message);
        return [];
    }
}

async function getCricketResults() {
    return [];
}

module.exports = {
    getCricketMatches,
    getCricketResults
};

const axios = require("axios");

const CRICAPI_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1/matches";

/* ================= FETCH ALL MATCHES (Paginated) ================= */
async function fetchAllMatches() {
    if (!CRICAPI_KEY) {
        console.error("❌ CRICAPI_KEY missing");
        return [];
    }

    let allMatches = [];
    let offset = 0;
    let totalRows = 1;

    try {
        while (offset < totalRows) {
            const res = await axios.get(BASE_URL, {
                params: {
                    apikey: CRICAPI_KEY,
                    offset
                },
                timeout: 15000
            });

            if (res.data.status !== "success") break;

            const data = Array.isArray(res.data.data) ? res.data.data : [];
            const info = res.data.info || {};

            totalRows = info.totalRows || 0;

            allMatches = allMatches.concat(data);
            offset += data.length;

            // Safety break (avoid infinite loop)
            if (data.length === 0) break;
        }

        return allMatches;

    } catch (err) {
        console.error("❌ CricAPI fetch error:", err.message);
        return [];
    }
}

/* ================== MATCH LIST ================== */
async function getCricketMatches() {
    const matches = await fetchAllMatches();
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return matches
        .filter(m => m.dateTimeGMT)
        .filter(m => {
            const matchTime = new Date(m.dateTimeGMT);
            return (
                // LIVE
                /live|playing/i.test(m.status || "") ||

                // UPCOMING within 24h
                (matchTime > now && matchTime <= next24)
            );
        })
        .map(m => {
            const matchTime = new Date(m.dateTimeGMT);
            const isLive = /live|playing/i.test(m.status || "");

            return {
                externalMatchId: `cricket_${m.id}`,
                sport: "cricket",
                league: m.series || "Cricket",
                team1: m.teams?.[0] || "Team A",
                team2: m.teams?.[1] || "Team B",
                team1Logo: null, // you can map manually if needed
                team2Logo: null,
                leagueLogo: null,
                startTime: matchTime.toISOString(),
                status: isLive ? "live" : "upcoming",
                bettingOpen: !isLive
            };
        });
}

/* ================== RESULTS ================== */
async function getCricketResults() {
    return []; // optional for now
}

module.exports = {
    getCricketMatches,
    getCricketResults
};

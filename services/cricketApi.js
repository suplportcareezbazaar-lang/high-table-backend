const axios = require("axios");

const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1/matches";

/* =========================
   FETCH ALL MATCHES (Paginated)
========================= */
async function fetchAllMatches() {
    if (!API_KEY) {
        console.error("❌ CRICAPI_KEY missing");
        return [];
    }

    let allMatches = [];
    let offset = 0;
    let totalRows = 0;

    try {
        do {
            const res = await axios.get(BASE_URL, {
                params: {
                    apikey: API_KEY,
                    offset: offset
                },
                timeout: 15000
            });

            if (res.data.status !== "success") {
                console.error("❌ CricAPI failed");
                return [];
            }

            const data = res.data.data || [];
            const info = res.data.info || {};

            totalRows = info.totalRows || 0;

            allMatches = allMatches.concat(data);

            offset += data.length;

        } while (offset < totalRows);

        return allMatches;

    } catch (err) {
        console.error("❌ CricAPI error:", err.message);
        return [];
    }
}

/* =========================
   NORMALIZE MATCHES
========================= */
async function getCricketMatches() {
    const rawMatches = await fetchAllMatches();
    const now = Date.now();

    return rawMatches
        .filter(m => m.dateTimeGMT && m.teams?.length === 2)
        .map(m => {
            const start = new Date(m.dateTimeGMT).getTime();

            let status = "upcoming";

            // LIVE if started but not finished
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
                team1Logo: null,
                team2Logo: null,
                leagueLogo: null,
                startTime: m.dateTimeGMT,
                status,
                bettingOpen: status === "upcoming"
            };
        })
        .filter(m => {
            const start = new Date(m.startTime).getTime();

            // LIVE
            if (m.status === "live") return true;

            // Upcoming within 24 hours
            return (
                m.status === "upcoming" &&
                start > now &&
                (start - now) <= 24 * 60 * 60 * 1000
            );
        });
}

/* =========================
   RESULTS (Optional Later)
========================= */
async function getCricketResults() {
    return [];
}

module.exports = {
    getCricketMatches,
    getCricketResults
};

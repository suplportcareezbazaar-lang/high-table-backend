const { getCricketMatches, getCricketResults } = require("./cricketApi");
const { getFootballMatches, getFootballResults } = require("./footballApi");
const { getBasketballMatches, getBasketballResults } = require("./basketballApi");
const { getMmaMatches, getMmaResults } = require("./mmaApi");

/* ================= NORMALIZER ================= */

async function normalize(fetchFn, sport) {
    try {
        const data = await fetchFn();
        if (!Array.isArray(data)) return [];

        const now = Date.now();
        const next24h = now + 24 * 60 * 60 * 1000;

        return data
            .filter(m => m.team1 && m.team2 && m.startTime)
            .map(m => {
                const start = new Date(m.startTime).getTime();

                let status = "upcoming";

                // LIVE = started within last 6 hours
                if (start <= now && (now - start) <= 6 * 60 * 60 * 1000) {
                    status = "live";
                }

                return {
                    id: m.externalMatchId,
                    sport,
                    league: m.league || sport.toUpperCase(),
                    team1: m.team1,
                    team2: m.team2,
                    startTime: new Date(m.startTime).toISOString(),
                    status,
                    bettingOpen: status === "upcoming",
                    team1Logo: m.team1Logo || null,
                    team2Logo: m.team2Logo || null,
                    leagueLogo: m.leagueLogo || null
                };
            })
            .filter(m => {
                const start = new Date(m.startTime).getTime();

                // Keep LIVE matches
                if (m.status === "live") return true;

                // Keep upcoming matches within next 24 hours
                if (m.status === "upcoming") {
                    return start > now && start <= next24h;
                }

                return false;
            });

    } catch (err) {
        console.error(`❌ ${sport} normalize failed:`, err.message);
        return [];
    }
}

/* ================= MATCHES ================= */

async function getAllMatches() {
    const results = await Promise.all([
        normalize(getCricketMatches, "cricket"),
        normalize(getFootballMatches, "football"),
        normalize(getBasketballMatches, "basketball"),
        normalize(getMmaMatches, "mma")
    ]);

    return results.flat();
}

/* ================= RESULTS ================= */

async function getAllResults() {
    const results = await Promise.allSettled([
        getCricketResults(),
        getFootballResults(),
        getBasketballResults(),
        getMmaResults()
    ]);

    return results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value || []);
}

module.exports = {
    getAllMatches,
    getAllResults
};

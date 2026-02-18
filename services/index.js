const { getCricketMatches, getCricketResults } = require("./cricketApi");
const { getFootballMatches, getFootballResults } = require("./footballApi");
const { getBasketballMatches, getBasketballResults } = require("./basketballApi");
const { getMmaMatches, getMmaResults } = require("./mmaApi");

function withinNext24Hours(startTime) {
    const now = Date.now();
    const t = new Date(startTime).getTime();
    return t > now && (t - now) <= 24 * 60 * 60 * 1000;
}

async function normalize(fetchFn, sport) {
    try {
        const data = await fetchFn();
        
        console.log(`==== RAW ${sport} DATA ====`);
        console.log(JSON.stringify(data?.slice(0, 2), null, 2));
        
        if (!Array.isArray(data)) return [];

        const now = Date.now();

        return data
            .filter(m => m.team1 && m.team2 && m.startTime)
            .map(m => {
                const start = new Date(m.startTime).getTime();

                let status = "upcoming";

                // 🔥 Use API status first
                if (m.status === "live") {
                    status = "live";
                } else if (m.status === "finished") {
                    status = "finished";
                } else if (start > now) {
                    status = "upcoming";
                } else {
                    status = "finished";
                }

                return {
                    id: `${sport}_${m.externalMatchId}`, // safer unique id
                    sport,
                    league: m.league || "Unknown League",
                    team1: m.team1,
                    team2: m.team2,
                    startTime: new Date(m.startTime).toISOString(),
                    status,
                    bettingOpen:
                        status === "upcoming" &&
                        (start - now > 30 * 60 * 1000), // close betting 30 min before
                    team1Logo: m.team1Logo || null,
                    team2Logo: m.team2Logo || null,
                    leagueLogo: m.leagueLogo || null
                };
            })
            .filter(m =>
                m.status === "live" ||
                (m.status === "upcoming" && withinNext24Hours(m.startTime))
            );

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

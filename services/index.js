const { getCricketMatches } = require("./services/cricketApi");
const { getFootballMatches } = require("./services/footballApi");
const { getBasketballMatches } = require("./services/basketballApi");
const { getMmaMatches } = require("./services/mmaApi");

/* ================= MATCH AGGREGATOR ================= */

async function getAllMatches() {
    try {
        const results = await Promise.allSettled([
            getCricketMatches(),
            getFootballMatches(),
            getBasketballMatches(),
            getMmaMatches()
        ]);

        const successful = results
            .filter(r => r.status === "fulfilled")
            .map(r => r.value || []);

        const allMatches = successful
            .flat()
            .filter(Boolean)
            .filter(m => m.id && m.team1 && m.team2 && m.startTime);

        console.log("========== MATCH FETCH SUMMARY ==========");
        console.log("Cricket:", successful[0]?.length || 0);
        console.log("Football:", successful[1]?.length || 0);
        console.log("Basketball:", successful[2]?.length || 0);
        console.log("MMA:", successful[3]?.length || 0);
        console.log("TOTAL:", allMatches.length);
        console.log("=========================================");

        return allMatches;

    } catch (err) {
        console.error("getAllMatches fatal error:", err.message);
        return [];
    }
}

module.exports = {
    getAllMatches
};

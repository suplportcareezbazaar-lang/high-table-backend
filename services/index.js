const { getCricketMatches } = require("./cricketApi");
const { getFootballMatches } = require("./footballApi");
const { getBasketballMatches } = require("./basketballApi");
const { getMmaMatches } = require("./mmaApi");

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

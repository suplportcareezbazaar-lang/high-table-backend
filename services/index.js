const { getCricketMatches } = require("./cricketApi");
const { getFootballMatches } = require("./footballApi");
const { getBasketballMatches } = require("./basketballApi");
const { getMmaMatches } = require("./mmaApi");

/* ================= MATCH AGGREGATOR ================= */

async function getAllMatches() {
    try {
        const football = await getFootballMatches();

        console.log("========== MATCH FETCH SUMMARY ==========");
        console.log("Football:", football.length);
        console.log("=========================================");

        return football;

    } catch (err) {
        console.error("getAllMatches fatal error:", err.message);
        return [];
    }
}

module.exports = {
    getAllMatches
};

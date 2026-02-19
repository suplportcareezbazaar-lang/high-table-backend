const { getCricketMatches } = require("./cricketApi");
const { getFootballMatches } = require("./footballApi");
const { getBasketballMatches } = require("./basketballApi");
const { getMmaMatches } = require("./mmaApi");

/* ================= MATCHES ================= */
async function getAllMatches() {
    try {
        const results = await Promise.all([
            getCricketMatches(),
            getFootballMatches(),
            getBasketballMatches(),
            getMmaMatches()
        ]);

        const all = results.flat().filter(Boolean);

        console.log("Total matches fetched:", all.length);

        return all;
    } catch (err) {
        console.error("getAllMatches error:", err.message);
        return [];
    }
}

module.exports = {
    getAllMatches
};

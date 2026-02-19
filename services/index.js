const { getCricketMatches, getCricketResults } = require("./cricketApi");

/* ================= MATCHES ================= */
async function getAllMatches() {
    try {
        const cricket = await getCricketMatches();
        return cricket;
    } catch (err) {
        console.error("❌ getAllMatches error:", err.message);
        return [];
    }
}

/* ================= RESULTS ================= */
async function getAllResults() {
    try {
        const results = await getCricketResults();
        return results;
    } catch (err) {
        console.error("❌ getAllResults error:", err.message);
        return [];
    }
}

module.exports = {
    getAllMatches,
    getAllResults
};

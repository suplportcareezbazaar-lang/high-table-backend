const { getCricketMatches, getCricketResults } = require("./cricketApi");

async function getAllMatches() {
    try {
        return await getCricketMatches();
    } catch (err) {
        console.error("getAllMatches error:", err.message);
        return [];
    }
}

async function getAllResults() {
    try {
        return await getCricketResults();
    } catch (err) {
        return [];
    }
}

module.exports = {
    getAllMatches,
    getAllResults
};

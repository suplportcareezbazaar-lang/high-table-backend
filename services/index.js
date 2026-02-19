const { getCricketMatches } = require("./cricketApi");

async function getAllMatches() {
    try {
        const cricket = await getCricketMatches();
        return cricket;
    } catch (err) {
        console.error("getAllMatches error:", err.message);
        return [];
    }
}

module.exports = {
    getAllMatches
};

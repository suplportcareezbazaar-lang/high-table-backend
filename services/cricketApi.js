const fetch = require("node-fetch");

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

// Fetch Current (Live) Matches
async function getCurrentMatches() {
    try {
        const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`);
        const json = await res.json();

        if (json.status !== "success" || !json.data) {
            console.error("Current matches API failed");
            return [];
        }

        return json.data.map(match => ({
            externalMatchId: match.id,
            team1: match.teams?.[0] || null,
            team2: match.teams?.[1] || null,
            startTime: match.dateTimeGMT,
            league: match.name,
            status: "live"
        }));

    } catch (err) {
        console.error("Error fetching current matches:", err.message);
        return [];
    }
}

// Fetch All Matches (Upcoming + Others)
async function getAllMatchesList() {
    try {
        const res = await fetch(`${BASE_URL}/matches?apikey=${API_KEY}&offset=0`);
        const json = await res.json();

        if (json.status !== "success" || !json.data) {
            console.error("Matches API failed");
            return [];
        }

        return json.data.map(match => ({
            externalMatchId: match.id,
            team1: match.teams?.[0] || null,
            team2: match.teams?.[1] || null,
            startTime: match.dateTimeGMT,
            league: match.name,
            status: "upcoming"
        }));

    } catch (err) {
        console.error("Error fetching matches:", err.message);
        return [];
    }
}

// MAIN EXPORT FUNCTION
async function getCricketMatches() {
    const [live, all] = await Promise.all([
        getCurrentMatches(),
        getAllMatchesList()
    ]);

    // Merge & remove duplicates by ID
    const map = new Map();

    [...live, ...all].forEach(match => {
        map.set(match.externalMatchId, match);
    });

    return Array.from(map.values());
}

module.exports = {
    getCricketMatches
};

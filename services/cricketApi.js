const fetch = require("node-fetch");

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

// Simple fetch wrapper with timeout
async function safeFetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        console.error("Fetch failed:", err.message);
        return null;
    }
}

async function getCricketMatches() {
    try {
        console.log("Fetching cricket matches...");

        const url = `${BASE_URL}/matches?apikey=${API_KEY}&offset=0`;

        const json = await safeFetch(url);

        if (!json) {
            console.error("No response from API");
            return [];
        }

        if (json.status !== "success") {
            console.error("API returned failure:", json);
            return [];
        }

        if (!Array.isArray(json.data)) {
            console.error("Data is not array:", json);
            return [];
        }

        const matches = json.data.map(match => ({
            externalMatchId: match.id,
            team1: match.teams?.[0] || null,
            team2: match.teams?.[1] || null,
            startTime: match.dateTimeGMT,
            league: match.name,
            status: match.status || "upcoming"
        }));

        console.log("Total matches fetched:", matches.length);

        return matches;

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = {
    getCricketMatches
};

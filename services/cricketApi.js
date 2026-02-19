const fetch = require("node-fetch");

const API_KEY = process.env.CRICAPI_KEY;   // ✅ FIXED NAME
const BASE_URL = "https://api.cricapi.com/v1";

async function safeFetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing in environment");
        return [];
    }

    try {
        console.log("Fetching cricket matches...");

        // 🔥 Use currentMatches endpoint (this works)
        const url = `${BASE_URL}/currentMatches?apikey=${API_KEY}`;

        const json = await safeFetch(url);

        if (!json || json.status !== "success" || !Array.isArray(json.data)) {
            console.error("Invalid API response");
            return [];
        }

        const matches = json.data.map(match => ({
            externalMatchId: `cricket_${match.id}`,
            team1: match.teamInfo?.[0]?.name || match.teams?.[0] || null,
            team2: match.teamInfo?.[1]?.name || match.teams?.[1] || null,
            team1Logo: match.teamInfo?.[0]?.img || null,
            team2Logo: match.teamInfo?.[1]?.img || null,
            startTime: match.dateTimeGMT,
            league: match.name,
            status: match.matchStarted && !match.matchEnded
                ? "live"
                : "upcoming"
        }));

        console.log("Total cricket matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = {
    getCricketMatches
};

const fetch = require("node-fetch");

const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

async function safeFetch(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        console.error("Cricket Fetch failed:", err.message);
        return null;
    }
}

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        const url = `${BASE_URL}/currentMatches?apikey=${API_KEY}`;
        const json = await safeFetch(url);

        if (!json || json.status !== "success" || !Array.isArray(json.data)) {
            return [];
        }

        return json.data.map(match => {
            const id = `cricket_${match.id}`;

            const status = match.matchEnded
                ? "finished"
                : match.matchStarted
                    ? "live"
                    : "upcoming";

            return {
                id,
                externalMatchId: id,
                sport: "cricket",
                league: match.name || "Cricket",
                team1: match.teamInfo?.[0]?.name || match.teams?.[0] || null,
                team2: match.teamInfo?.[1]?.name || match.teams?.[1] || null,
                team1Logo: match.teamInfo?.[0]?.img || null,
                team2Logo: match.teamInfo?.[1]?.img || null,
                startTime: match.dateTimeGMT,
                status,
                bettingOpen: isBettingOpen(match.dateTimeGMT)
            };
        });

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = { getCricketMatches };

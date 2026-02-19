const fetch = require("node-fetch");

const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

/* ================= HELPERS ================= */

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

function normalizeStatus(match) {
    if (!match.dateTimeGMT) return "upcoming";

    const now = new Date();
    const matchTime = new Date(match.dateTimeGMT);

    if (match.status?.toLowerCase().includes("won") ||
        match.status?.toLowerCase().includes("result")) {
        return "finished";
    }

    if (matchTime <= now) {
        return "live";
    }

    return "upcoming";
}

async function fetchFromOffset(offset = 0) {
    const url = `${BASE_URL}/matches?apikey=${API_KEY}&offset=${offset}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json || json.status !== "success") {
        console.error("Cricket API failed:", json);
        return [];
    }

    const data = json.data || [];
    const totalRows = json.info?.totalRows || 0;

    if (offset + 25 < totalRows) {
        const next = await fetchFromOffset(offset + 25);
        return data.concat(next);
    }

    return data;
}

/* ================= MAIN FUNCTION ================= */

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    const url = `https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`;

    try {
        const res = await fetch(url);
        const json = await res.json();

        console.log("===== RAW CRICAPI RESPONSE =====");
        console.log(JSON.stringify(json, null, 2));
        console.log("================================");

        return []; // temporarily return empty
    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = { getCricketMatches };

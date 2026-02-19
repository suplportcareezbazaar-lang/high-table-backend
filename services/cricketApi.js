const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

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

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        console.log("Fetching cricket matches...");

        const rawMatches = await fetchFromOffset(0);

        console.log("Raw cricket matches:", rawMatches.length);

        const now = new Date();

        const filtered = rawMatches.filter(m => {
            if (!m.teams || m.teams.length < 2) return false;
            if (!m.dateTimeGMT) return false;

            const matchTime = new Date(m.dateTimeGMT);

            return matchTime >= new Date(now.getTime() - 6 * 60 * 60 * 1000);
        });

        const matches = filtered.map(match => {
            const id = `cricket_${match.id}`;

            return {
                id,
                externalMatchId: id,
                sport: "cricket",
                league: match.name || "Cricket",
                team1: match.teams[0],
                team2: match.teams[1],
                team1Logo: null,
                team2Logo: null,
                startTime: match.dateTimeGMT,
                status: normalizeStatus(match),
                bettingOpen: isBettingOpen(match.dateTimeGMT)
            };
        });

        console.log("Processed cricket matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = { getCricketMatches };

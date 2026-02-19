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

    if (matchTime <= now) return "live";

    return "upcoming";
}

function isRequiredMatch(match) {
    if (!match.matchType) return false;

    const type = match.matchType.toLowerCase();
    const name = (match.name || "").toLowerCase();

    // Accept any T20 type
    const isT20 = type.includes("t20");

    // Accept ODI
    const isODI = type.includes("odi");

    if (!isT20 && !isODI) return false;

    // IPL
    if (name.includes("premier league") || name.includes("ipl")) return true;

    // U19
    if (name.includes("u19")) return true;

    // Women
    if (name.includes("women")) return true;

    // Also allow international ODI/T20
    if (isT20 || isODI) return true;

    return false;
}

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        console.log("Fetching cricket matches (Filtered IPL / U19 / ODI)...");

        const url = `${BASE_URL}/matches?apikey=${API_KEY}&offset=0`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json || json.status !== "success") {
            console.error("Cricket API failed:", json);
            return [];
        }

        const rawMatches = json.data || [];

        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        const filtered = rawMatches.filter(m => {
            if (!m.teams || m.teams.length < 2) return false;
            if (!m.dateTimeGMT) return false;
            if (!isRequiredMatch(m)) return false;

            const matchTime = new Date(m.dateTimeGMT);

            return matchTime >= now && matchTime <= threeDaysLater;
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

        console.log("Filtered cricket matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = { getCricketMatches };

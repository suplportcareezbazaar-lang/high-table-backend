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

    const statusText = (match.status || "").toLowerCase();

    if (statusText.includes("won") || statusText.includes("result"))
        return "finished";

    if (matchTime <= now) return "live";

    return "upcoming";
}

/* ================= FILTER LOGIC ================= */

function isRequiredMatch(match) {
    if (!match.matchType) return false;

    const type = match.matchType.toLowerCase();
    const name = (match.name || "").toLowerCase();

    // Only T20 or ODI formats
    const isT20 = type.includes("t20");
    const isODI = type.includes("odi");

    if (!isT20 && !isODI) return false;

    // Keep important tournaments only
    if (
        name.includes("icc") ||
        name.includes("world cup") ||
        name.includes("asia cup") ||
        name.includes("champions") ||
        name.includes("premier league") ||
        name.includes("ipl")
    ) {
        return true;
    }

    // Allow India international matches
    if (
        match.teams?.some(t => t.toLowerCase().includes("india"))
    ) {
        return true;
    }

    return false;
}

/* ================= MAIN FUNCTION ================= */

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        console.log("Fetching cricket matches (ICC / International filter)...");

        const url = `${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json || json.status !== "success") {
            console.error("Cricket API failed:", json);
            return [];
        }

        const rawMatches = json.data || [];

        console.log("Total matches from API:", rawMatches.length);

        const now = new Date();
        const fiveDaysLater = new Date(
            now.getTime() + 5 * 24 * 60 * 60 * 1000
        );

        const filtered = rawMatches.filter(m => {
            if (!m.teams || m.teams.length < 2) return false;
            if (!m.dateTimeGMT) return false;
            if (!isRequiredMatch(m)) return false;

            const matchTime = new Date(m.dateTimeGMT);

            return matchTime >= now && matchTime <= fiveDaysLater;
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
                bettingOpen: isBettingOpen(match.dateTimeGMT),
                sportLogo: "/assets/logos/cricket.png"
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

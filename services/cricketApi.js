const API_KEY = process.env.CRICAPI_KEY;
const BASE_URL = "https://api.cricapi.com/v1";

/* ================= HELPERS ================= */

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

function normalizeStatus(match, isLiveApi = false) {
    if (!match.dateTimeGMT) return "upcoming";

    const now = new Date();
    const matchTime = new Date(match.dateTimeGMT);

    if (match.status?.toLowerCase().includes("won") ||
        match.status?.toLowerCase().includes("result")) {
        return "finished";
    }

    if (isLiveApi) return "live";

    if (matchTime <= now) return "live";

    return "upcoming";
}

/* ================= FILTER LOGIC ================= */

function isImportantMatch(match) {
    if (!match.matchType) return false;

    const type = match.matchType.toLowerCase();
    const name = (match.name || "").toLowerCase();
    const team1 = (match.teams?.[0] || "").toLowerCase();
    const team2 = (match.teams?.[1] || "").toLowerCase();

    const isT20 = type.includes("t20");
    const isODI = type.includes("odi");

    if (!isT20 && !isODI) return false;

    // IPL
    if (name.includes("ipl") || name.includes("premier league")) return true;

    // ICC tournaments
    if (
        name.includes("icc") ||
        name.includes("world cup") ||
        name.includes("asia cup") ||
        name.includes("champions trophy")
    ) return true;

    // India matches
    if (team1.includes("india") || team2.includes("india")) return true;

    // U19
    if (name.includes("u19")) return true;

    // Women matches
    if (name.includes("women")) return true;

    return false;
}

/* ================= MAIN FUNCTION ================= */

async function getCricketMatches() {
    if (!API_KEY) {
        console.error("CRICAPI_KEY missing");
        return [];
    }

    try {
        console.log("Fetching cricket matches...");

        /* ---------- 1️⃣ LIVE MATCHES ---------- */
        const liveUrl = `${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`;
        const liveRes = await fetch(liveUrl);
        const liveJson = await liveRes.json();

        const liveMatches = (liveJson.data || [])
            .filter(m => m.teams?.length >= 2)
            .filter(isImportantMatch)
            .map(match => ({
                id: `cricket_${match.id}`,
                externalMatchId: `cricket_${match.id}`,
                sport: "cricket",
                league: match.name || "Cricket",
                team1: match.teams[0],
                team2: match.teams[1],
                team1Logo: null,
                team2Logo: null,
                startTime: match.dateTimeGMT,
                status: normalizeStatus(match, true),
                bettingOpen: isBettingOpen(match.dateTimeGMT)
            }));

        console.log("Live matches:", liveMatches.length);

        /* ---------- 2️⃣ UPCOMING MATCHES ---------- */
        const upcomingUrl = `${BASE_URL}/matches?apikey=${API_KEY}&offset=0`;
        const upcomingRes = await fetch(upcomingUrl);
        const upcomingJson = await upcomingRes.json();

        const now = new Date();

        const upcomingMatches = (upcomingJson.data || [])
            .filter(m => m.teams?.length >= 2)
            .filter(m => {
                if (!m.dateTimeGMT) return false;

                const matchTime = new Date(m.dateTimeGMT);

                // Only future matches
                if (matchTime <= now) return false;

                // Only ODI & T20
                const type = (m.matchType || "").toLowerCase();
                return type.includes("t20") || type.includes("odi");
            })
            .map(match => ({
                id: `cricket_${match.id}`,
                externalMatchId: `cricket_${match.id}`,
                sport: "cricket",
                league: match.name || "Cricket",
                team1: match.teams[0],
                team2: match.teams[1],
                team1Logo: null,
                team2Logo: null,
                startTime: match.dateTimeGMT,
                status: "upcoming",
                bettingOpen: isBettingOpen(match.dateTimeGMT)
            }));

        console.log("Upcoming matches:", upcomingMatches.length);

        /* ---------- MERGE ---------- */
        const allMatches = [...liveMatches, ...upcomingMatches];

        console.log("Total cricket matches returned:", allMatches.length);

        return allMatches;

    } catch (err) {
        console.error("Cricket API error:", err.message);
        return [];
    }
}

module.exports = { getCricketMatches };

const API_KEY = process.env.SPORTSDB_KEY || "1";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

/* ================= FILTER ================= */

function isImportantMMA(leagueName = "") {
    leagueName = leagueName.toLowerCase();

    return (
        leagueName.includes("ufc") ||
        leagueName.includes("bellator") ||
        leagueName.includes("one championship")
    );
}

/* ================= MAIN ================= */

async function getMmaMatches() {
    try {
        console.log("Fetching MMA events...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=MMA`;
        const res = await fetch(url);

        if (!res.ok) {
            console.log("MMA API response not OK");
            return [];
        }

        const json = await res.json();
        const events = json.events || [];

        const matches = events
            .filter(e => isImportantMMA(e.strLeague || ""))
            .map(event => ({
                id: `mma_${event.idEvent}`,
                externalMatchId: `mma_${event.idEvent}`,
                sport: "mma",
                league: event.strLeague || "MMA",
                team1: event.strHomeTeam || event.strEvent || "Fighter 1",
                team2: event.strAwayTeam || "Fighter 2",
                team1Logo: null,
                team2Logo: null,
                startTime: event.dateEvent,
                status: "upcoming",
                bettingOpen: true
            }));

        console.log("MMA matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("MMA API error:", err.message);
        return [];
    }
}

module.exports = { getMmaMatches };

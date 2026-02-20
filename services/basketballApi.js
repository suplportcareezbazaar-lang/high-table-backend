const API_KEY = process.env.SPORTSDB_KEY || "1";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

/* ================= FILTER ================= */

function isImportantBasketball(league = "") {
    league = league.toLowerCase();

    return (
        league.includes("nba") ||
        league.includes("fiba") ||
        league.includes("euroleague") ||
        league.includes("world cup")
    );
}

/* ================= MAIN ================= */

async function getBasketballMatches() {
    try {
        console.log("Fetching basketball matches...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=Basketball`;
        const res = await fetch(url);

        if (!res.ok) {
            console.log("Basketball API response not OK");
            return [];
        }

        const json = await res.json();
        const events = json.events || [];

        const matches = events
            .filter(e => isImportantBasketball(e.strLeague || ""))
            .map(event => ({
                id: `basketball_${event.idEvent}`,
                externalMatchId: `basketball_${event.idEvent}`,
                sport: "basketball",
                league: event.strLeague,
                team1: event.strHomeTeam,
                team2: event.strAwayTeam,
                team1Logo: null,
                team2Logo: null,
                startTime: event.dateEvent,
                status: "upcoming",
                bettingOpen: true
            }));

        console.log("Basketball matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

module.exports = { getBasketballMatches };

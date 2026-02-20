const API_KEY = process.env.SPORTSDB_KEY || "1";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

/* ================= FILTER ================= */

function isImportantFootball(league = "") {
    league = league.toLowerCase();

    return (
        league.includes("fifa") ||
        league.includes("uefa") ||
        league.includes("world cup") ||
        league.includes("champions league") ||
        league.includes("premier league")
    );
}

/* ================= MAIN ================= */

async function getFootballMatches() {
    try {
        console.log("Fetching football matches from SportsDB...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`;
        const res = await fetch(url);

        if (!res.ok) {
            console.log("Football API response not OK");
            return [];
        }

        const json = await res.json();
        const events = json.events || [];

        const matches = events
            .filter(e => isImportantFootball(e.strLeague || ""))
            .map(event => ({
                id: `football_${event.idEvent}`,
                externalMatchId: `football_${event.idEvent}`,
                sport: "football",
                league: event.strLeague,
                team1: event.strHomeTeam,
                team2: event.strAwayTeam,
                team1Logo: null,
                team2Logo: null,
                startTime: event.dateEvent,
                status: "upcoming",
                bettingOpen: true
            }));

        console.log("Football matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

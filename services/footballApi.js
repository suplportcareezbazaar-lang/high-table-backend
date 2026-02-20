const API_KEY = process.env.SPORTSDB_KEY || "1";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

function isBettingOpen(startTime) {
    if (!startTime) return false;
    return (new Date(startTime) - Date.now()) / 60000 > 30;
}

function normalizeStatus(event) {
    if (event.strStatus === "Match Finished") return "finished";
    if (event.strStatus === "Live") return "live";
    return "upcoming";
}

function isImportantLeague(leagueName = "") {
    leagueName = leagueName.toLowerCase();

    return (
        leagueName.includes("fifa") ||
        leagueName.includes("uefa") ||
        leagueName.includes("champions league") ||
        leagueName.includes("world cup") ||
        leagueName.includes("euro")
    );
}

async function getFootballMatches() {
    try {
        console.log("Fetching football matches from SportsDB...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=Soccer`;
        const res = await fetch(url);
        const json = await res.json();

        const events = json.events || [];

        const matches = events
            .filter(e => isImportantLeague(e.strLeague))
            .map(event => ({
                id: `football_${event.idEvent}`,
                externalMatchId: `football_${event.idEvent}`,
                sport: "football",
                league: event.strLeague,
                team1: event.strHomeTeam,
                team2: event.strAwayTeam,
                team1Logo: event.strHomeTeamBadge || null,
                team2Logo: event.strAwayTeamBadge || null,
                startTime: event.dateEvent + "T" + (event.strTime || "00:00:00"),
                status: normalizeStatus(event),
                bettingOpen: isBettingOpen(event.dateEvent)
            }));

        console.log("Football matches:", matches.length);

        return matches;

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

const API_KEY = process.env.SPORTSDB_KEY || "1";
const BASE_URL = "https://www.thesportsdb.com/api/v1/json";

function isImportantLeague(leagueName = "") {
    leagueName = leagueName.toLowerCase();

    return (
        leagueName.includes("nba") ||
        leagueName.includes("fiba") ||
        leagueName.includes("world cup") ||
        leagueName.includes("euroleague")
    );
}

async function getBasketballMatches() {
    try {
        console.log("Fetching basketball matches...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/${API_KEY}/eventsday.php?d=${today}&s=Basketball`;
        const res = await fetch(url);
        const json = await res.json();

        const events = json.events || [];

        const matches = events
            .filter(e => isImportantLeague(e.strLeague))
            .map(event => ({
                id: `basketball_${event.idEvent}`,
                externalMatchId: `basketball_${event.idEvent}`,
                sport: "basketball",
                league: event.strLeague,
                team1: event.strHomeTeam,
                team2: event.strAwayTeam,
                team1Logo: event.strHomeTeamBadge || null,
                team2Logo: event.strAwayTeamBadge || null,
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

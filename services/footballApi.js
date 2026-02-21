const SPORTSDB_KEY = process.env.SPORTSDB_KEY;

const IMPORTANT_LEAGUES = [
    "4328", // EPL
    "4335", // La Liga
    "4331", // Bundesliga
    "4332", // Serie A
    "4480"  // Champions League
];

function isWithinHours(dateStr, hours = 72) {
    const now = new Date();
    const matchDate = new Date(dateStr);
    const diffHours = (matchDate - now) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= hours;
}

async function fetchLeagueEvents(leagueId) {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnextleague.php?id=${leagueId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.events) return [];

        return data.events
            .filter(event => event.strTimestamp && isWithinHours(event.strTimestamp, 72))
            .map(event => ({
                id: `football_${event.idEvent}`,
                externalMatchId: event.idEvent,
                sport: "football",
                league: event.strLeague,
                team1: event.strHomeTeam,
                team2: event.strAwayTeam,
                team1Logo: event.strHomeTeamBadge || null,
                team2Logo: event.strAwayTeamBadge || null,
                startTime: event.strTimestamp,
                status: "upcoming",
                bettingOpen: true,
                leagueLogo: event.strLeagueBadge || null,
                sportLogo: "/assets/logos/football.png"
            }));

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

async function getFootballMatches() {
    console.log("⚽ Fetching important football leagues...");

    let allMatches = [];

    for (const leagueId of IMPORTANT_LEAGUES) {
        const matches = await fetchLeagueEvents(leagueId);
        allMatches = [...allMatches, ...matches];
    }

    return allMatches;
}

module.exports = { getFootballMatches };

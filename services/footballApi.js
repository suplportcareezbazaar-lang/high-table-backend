const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

async function getFootballMatches() {
    try {
        console.log("Fetching football matches from SportsDB...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/eventsday.php?d=${today}&s=Soccer`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.events) return [];

        return data.events.map(event => ({
            id: `football_${event.idEvent}`,
            externalMatchId: `football_${event.idEvent}`,
            sport: "football",
            league: event.strLeague,
            team1: event.strHomeTeam,
            team2: event.strAwayTeam,
            team1Logo: null,
            team2Logo: null,
            startTime: event.dateEvent + "T" + (event.strTime || "00:00:00"),
            status: "upcoming",
            bettingOpen: true,
            leagueLogo: null,
            sportLogo: "/assets/logos/football.png"
        }));

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

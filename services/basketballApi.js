const BASE_URL = "https://www.thesportsdb.com/api/v1/json/1";

function formatMatch(event, sport) {
    return {
        id: `${sport}_${event.idEvent}`,
        externalMatchId: `${sport}_${event.idEvent}`,
        sport,
        league: event.strLeague || sport,
        team1: event.strHomeTeam,
        team2: event.strAwayTeam,
        team1Logo: null,
        team2Logo: null,
        startTime: event.dateEvent + "T00:00:00",
        status: "upcoming",
        bettingOpen: true
    };
}

async function getBasketballMatches() {
    try {
        console.log("Fetching basketball matches from SportsDB...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/eventsday.php?d=${today}&s=Basketball`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.events) return [];

        const importantLeagues = [
            "NBA",
            "FIBA World Cup",
            "EuroLeague"
        ];

        const filtered = data.events.filter(e =>
            importantLeagues.some(l =>
                (e.strLeague || "").includes(l)
            )
        );

        return filtered.map(e => formatMatch(e, "basketball"));

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

module.exports = { getBasketballMatches };

const SPORTSDB_KEY = process.env.SPORTSDB_KEY || "1";

function getDateString(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split("T")[0];
}

async function fetchEventsByDate(dateStr) {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsday.php?d=${dateStr}&s=Basketball`;

        const response = await fetch(url);
        const text = await response.text();

        if (text.startsWith("<")) return [];

        const data = JSON.parse(text);
        if (!data.events) return [];

        return data.events.map(event => ({
            id: `basketball_${event.idEvent}`,
            externalMatchId: event.idEvent,
            sport: "basketball",
            league: event.strLeague,
            team1: event.strHomeTeam,
            team2: event.strAwayTeam,
            team1Logo: null,
            team2Logo: null,
            startTime: event.strTimestamp,
            status: "upcoming",
            bettingOpen: true,
            leagueLogo: null,
            sportLogo: "/assets/logos/basketball.png"
        }));

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

async function getBasketballMatches() {
    let allMatches = [];
    for (let i = 0; i <= 2; i++) {
        const matches = await fetchEventsByDate(getDateString(i));
        allMatches = [...allMatches, ...matches];
    }
    return allMatches;
}

module.exports = { getBasketballMatches };

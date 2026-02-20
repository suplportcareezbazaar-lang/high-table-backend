const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

async function getMmaMatches() {
    try {
        console.log("Fetching MMA matches...");

        const today = new Date().toISOString().split("T")[0];

        const url = `${BASE_URL}/eventsday.php?d=${today}&s=Mixed Martial Arts`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.events) return [];

        return data.events.map(event => ({
            id: `mma_${event.idEvent}`,
            externalMatchId: `mma_${event.idEvent}`,
            sport: "mma",
            league: event.strLeague,
            team1: event.strHomeTeam,
            team2: event.strAwayTeam,
            team1Logo: null,
            team2Logo: null,
            startTime: event.dateEvent + "T" + (event.strTime || "00:00:00"),
            status: "upcoming",
            bettingOpen: true,
            leagueLogo: null,
            sportLogo: "/assets/logos/mma.png"
        }));

    } catch (err) {
        console.error("MMA API error:", err.message);
        return [];
    }
}

module.exports = { getMmaMatches };

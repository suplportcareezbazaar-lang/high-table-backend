const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

function getStatus(event) {
    if (event.strStatus === "Match Finished") return "finished";
    if (event.strStatus === "Live") return "live";
    return "upcoming";
}

function formatMatch(event) {
    return {
        id: `football_${event.idEvent}`,
        externalMatchId: `football_${event.idEvent}`,
        sport: "football",
        league: event.strLeague,
        team1: event.strHomeTeam,
        team2: event.strAwayTeam,
        team1Logo: null,
        team2Logo: null,
        startTime: `${event.dateEvent}T${event.strTime || "00:00:00"}`,
        status: getStatus(event),
        bettingOpen: event.strStatus !== "Match Finished",
        leagueLogo: null,
        sportLogo: "/assets/logos/football.png"
    };
}

async function fetchDay(date) {
    const url = `${BASE_URL}/eventsday.php?d=${date}&s=Soccer`;
    const res = await fetch(url);
    const json = await res.json();
    return json.events || [];
}

async function getFootballMatches() {
    try {
        console.log("Fetching football matches...");

        const today = new Date();
        const dates = [];

        for (let i = 0; i < 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d.toISOString().split("T")[0]);
        }

        const results = await Promise.all(dates.map(fetchDay));
        const events = results.flat();

        const unique = new Map();
        events.forEach(e => {
            if (!unique.has(e.idEvent)) {
                unique.set(e.idEvent, formatMatch(e));
            }
        });

        return Array.from(unique.values());

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

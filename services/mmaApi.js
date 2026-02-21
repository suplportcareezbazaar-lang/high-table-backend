const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

function getStatus(event) {
    if (event.strStatus === "Match Finished") return "finished";
    if (event.strStatus === "Live") return "live";
    return "upcoming";
}

function formatMatch(event) {
    return {
        id: `mma_${event.idEvent}`,
        externalMatchId: `mma_${event.idEvent}`,
        sport: "mma",
        league: event.strLeague,
        team1: event.strHomeTeam || event.strEvent,
        team2: event.strAwayTeam || "",
        team1Logo: null,
        team2Logo: null,
        startTime: `${event.dateEvent}T${event.strTime || "00:00:00"}`,
        status: getStatus(event),
        bettingOpen: event.strStatus !== "Match Finished",
        leagueLogo: null,
        sportLogo: "/assets/logos/mma.png"
    };
}

async function fetchDay(date) {
    const url = `${BASE_URL}/eventsday.php?d=${date}&s=MMA`;
    const res = await fetch(url);
    const json = await res.json();
    return json.events || [];
}

async function getMmaMatches() {
    try {
        console.log("Fetching MMA matches...");

        const today = new Date();
        const dates = [];

        for (let i = 0; i < 7; i++) {
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
        console.error("MMA API error:", err.message);
        return [];
    }
}

module.exports = { getMmaMatches };

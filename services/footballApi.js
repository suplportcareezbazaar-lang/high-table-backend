const fetch = require("node-fetch");

const SPORTSDB_KEY = process.env.SPORTSDB_KEY;
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;

/* ================= STATUS NORMALIZER ================= */

function normalizeStatus(event) {
    if (!event.strTimestamp) return "upcoming";

    const now = new Date();
    const matchTime = new Date(event.strTimestamp);

    if (event.strStatus === "Match Finished") return "finished";
    if (event.strStatus === "Live") return "live";

    if (matchTime <= now) return "live";

    return "upcoming";
}

/* ================= MAIN FUNCTION ================= */

async function getFootballMatches() {
    try {
        console.log("⚽ Fetching football matches...");

        const today = new Date().toISOString().split("T")[0];

        const res = await fetch(`${BASE_URL}/eventsday.php?d=${today}&s=Soccer`);
        const data = await res.json();

        if (!data.events) return [];

        return data.events.map(event => ({
            id: `football_${event.idEvent}`,
            externalMatchId: `football_${event.idEvent}`,
            sport: "football",
            league: event.strLeague,
            team1: event.strHomeTeam,
            team2: event.strAwayTeam,
            team1Logo: event.strHomeTeamBadge || null,
            team2Logo: event.strAwayTeamBadge || null,
            startTime: event.strTimestamp,
            status: normalizeStatus(event),
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

const axios = require("axios");

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123";

// English Premier League ID = 4328
// You can change league ID later if needed
const LEAGUE_ID = 4328;

async function getFootballMatches() {
    try {
        console.log("⚽ Fetching football upcoming matches...");

        const response = await axios.get(
            `${BASE_URL}/eventsnextleague.php?id=${LEAGUE_ID}`
        );

        const events = response.data?.events || [];

        if (!events.length) {
            console.log("No football events returned");
            return [];
        }

        const matches = events.map(event => ({
            id: `football_${event.idEvent}`,
            externalMatchId: event.idEvent,
            sport: "football",
            league: event.strLeague,
            team1: event.strHomeTeam,
            team2: event.strAwayTeam,
            team1Logo: event.strHomeTeamBadge || null,
            team2Logo: event.strAwayTeamBadge || null,
            startTime: event.dateEvent + "T" + (event.strTime || "00:00:00"),
            status: "upcoming",
            bettingOpen: true,
            leagueLogo: null,
            sportLogo: "/assets/logos/football.png"
        }));

        console.log("Football matches fetched:", matches.length);
        return matches;

    } catch (error) {
        console.error("Football API error:", error.message);
        return [];
    }
}

module.exports = {
    getFootballMatches
};

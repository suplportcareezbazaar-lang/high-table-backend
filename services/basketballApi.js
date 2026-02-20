const API_KEY = process.env.API_SPORTS_KEY;

function isImportantBasketballMatch(match) {
    const leagueName = match.league?.name?.toLowerCase() || "";

    const importantLeagues = [
        "nba",
        "fiba",
        "euroleague",
        "olympic"
    ];

    return importantLeagues.some(name =>
        leagueName.includes(name)
    );
}

async function getBasketballMatches() {
    try {
        const today = new Date().toISOString().split("T")[0];

        const url = `https://v1.basketball.api-sports.io/games?date=${today}`;

        const res = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const json = await res.json();
        const data = json.response || [];

        const matches = data
            .filter(isImportantBasketballMatch)
            .map(match => ({
                id: `basketball_${match.id}`,
                externalMatchId: `basketball_${match.id}`,
                sport: "basketball",
                league: match.league.name,
                team1: match.teams.home.name,
                team2: match.teams.away.name,
                team1Logo: match.teams.home.logo,
                team2Logo: match.teams.away.logo,
                startTime: match.date,
                status: match.status.short === "NS" ? "upcoming" : "live",
                bettingOpen: true
            }));

        return matches;

    } catch (err) {
        console.error("Basketball API error:", err.message);
        return [];
    }
}

module.exports = { getBasketballMatches };

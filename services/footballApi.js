const API_KEY = process.env.API_SPORTS_KEY;

function isImportantFootballMatch(match) {
    const leagueName = match.league?.name?.toLowerCase() || "";
    const country = match.league?.country?.toLowerCase() || "";

    const importantLeagues = [
        "world cup",
        "euro",
        "copa america",
        "asian cup",
        "nations league",
        "champions league",
        "europa league"
    ];

    return importantLeagues.some(name =>
        leagueName.includes(name)
    );
}

async function getFootballMatches() {
    try {
        const today = new Date().toISOString().split("T")[0];

        const url = `https://v3.football.api-sports.io/fixtures?from=${today}&to=${today}`;
        
        const res = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const json = await res.json();
        const data = json.response || [];

        const matches = data
            .filter(isImportantFootballMatch)
            .map(match => ({
                id: `football_${match.fixture.id}`,
                externalMatchId: `football_${match.fixture.id}`,
                sport: "football",
                league: match.league.name,
                team1: match.teams.home.name,
                team2: match.teams.away.name,
                team1Logo: match.teams.home.logo,
                team2Logo: match.teams.away.logo,
                startTime: match.fixture.date,
                status: match.fixture.status.short === "NS" ? "upcoming" : "live",
                bettingOpen: true
            }));

        return matches;

    } catch (err) {
        console.error("Football API error:", err.message);
        return [];
    }
}

module.exports = { getFootballMatches };

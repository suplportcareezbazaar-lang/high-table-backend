const API_KEY = process.env.API_SPORTS_KEY;

async function getMmaMatches() {
    try {
        const url = `https://v1.mma.api-sports.io/fights?league=UFC`;

        const res = await fetch(url, {
            headers: {
                "x-apisports-key": API_KEY
            }
        });

        const json = await res.json();
        const data = json.response || [];

        const matches = data.map(fight => ({
            id: `mma_${fight.id}`,
            externalMatchId: `mma_${fight.id}`,
            sport: "mma",
            league: "UFC",
            team1: fight.fighters[0]?.name,
            team2: fight.fighters[1]?.name,
            team1Logo: null,
            team2Logo: null,
            startTime: fight.date,
            status: fight.status === "Scheduled" ? "upcoming" : "live",
            bettingOpen: true
        }));

        return matches;

    } catch (err) {
        console.error("MMA API error:", err.message);
        return [];
    }
}

module.exports = { getMmaMatches };

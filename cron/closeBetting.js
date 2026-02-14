const fs = require("fs");
const path = require("path");

const MATCHES_FILE = path.join(__dirname, "../data/matches.json");

function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function minutesDiff(startTime) {
    const now = new Date();
    const matchTime = new Date(startTime);
    return Math.floor((matchTime - now) / 60000);
}

function closeBetting() {
    const matches = readJSON(MATCHES_FILE);
    let updated = false;

    matches.forEach(match => {
        if (match.status !== "upcoming") return;

        const minsLeft = minutesDiff(match.startTime);

        if (minsLeft <= 30 && match.bettingOpen === true) {
            match.bettingOpen = false;
            updated = true;
            console.log(`⛔ Betting closed for ${match.team1} vs ${match.team2}`);
        }
    });

    if (updated) {
        writeJSON(MATCHES_FILE, matches);
        console.log("✅ Betting close update saved");
    }
}

closeBetting();

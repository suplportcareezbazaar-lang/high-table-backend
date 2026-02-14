const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { getAllResults } = require("../services");

const MATCHES_FILE = path.join(__dirname, "../data/matches.json");

function readJSON(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function syncResults() {
    console.log("🔄 Syncing match results...");

    const apiResults = await getAllResults();
    if (!apiResults.length) {
        console.log("⚠️ No finished matches from API");
        return;
    }

    const matches = readJSON(MATCHES_FILE);
    let updated = 0;

    apiResults.forEach(apiMatch => {
        const local = matches.find(
            m => m.externalMatchId === apiMatch.externalMatchId
        );

        if (
            local &&
            local.status !== "finished"
        ) {
            local.status = "finished";
            local.bettingOpen = false;
            local.winner = apiMatch.winner;
            local.settled = false;
            updated++;
        }
    });

    if (updated > 0) {
        writeJSON(MATCHES_FILE, matches);
        console.log(`✅ Results synced: ${updated}`);
    } else {
        console.log("ℹ️ No matches needed update");
    }
}

syncResults();

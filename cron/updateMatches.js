const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { getAllMatches } = require("../services");

// ✅ correct absolute path
const MATCHES_FILE = path.join(__dirname, "../data/matches.json");

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function updateMatches() {
    console.log("⏳ Updating cricket matches...");

    const apiMatches = await getAllMatches();

    if (!apiMatches.length) {
        console.log("⚠️ No matches fetched from API");
        return;
    }

    writeJSON(MATCHES_FILE, apiMatches);
    console.log(`✅ Matches updated: ${apiMatches.length}`);
}

updateMatches();

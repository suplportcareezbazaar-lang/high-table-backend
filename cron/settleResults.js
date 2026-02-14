// cron/settleResults.js
const fs = require("fs");
const path = require("path");

const MATCHES_FILE = path.join(__dirname, "../data/matches.json");
const BETS_FILE = path.join(__dirname, "../data/bets.json");
const WALLETS_FILE = path.join(__dirname, "../data/wallets.json");

function readJSON(file) {
    return fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf8"))
        : [];
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

console.log("⚙️ Running automatic settlement...");

const matches = readJSON(MATCHES_FILE);
const bets = readJSON(BETS_FILE);
const wallets = readJSON(WALLETS_FILE);

let settledCount = 0;

matches.forEach(match => {
    if (
        match.status === "finished" &&
        match.winner &&
        match.settled !== true
    ) {
        bets
            .filter(b => b.matchId === match.externalMatchId && b.status === "pending")
            .forEach(bet => {
                const wallet = wallets.find(w => w.userId === bet.userId);
                if (!wallet) return;

                if (bet.selectedTeam === match.winner) {
                    wallet.tokens += bet.mainBet * bet.odds;
                } else {
                    wallet.tokens += bet.hedgeBet * bet.odds;
                }

                bet.status = "settled";
            });

        match.settled = true;
        settledCount++;
    }
});

writeJSON(WALLETS_FILE, wallets);
writeJSON(BETS_FILE, bets);
writeJSON(MATCHES_FILE, matches);

console.log(`✅ Settled matches: ${settledCount}`);

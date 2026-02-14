require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const withdrawalsPath = path.join(__dirname, "../data/withdrawals.json");
const banksPath = path.join(__dirname, "../data/banks.json");

function readJSON(p) {
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJSON(p, data) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function processPayouts() {
    console.log("🔁 AUTO PAYOUT RUN STARTED");

    const withdrawals = readJSON(withdrawalsPath);
    const banks = readJSON(banksPath);

    for (const w of withdrawals) {
        if (w.status !== "pending") continue;

        const bank = banks.find(b => b.userId === w.userId);
        if (!bank) {
            w.status = "failed";
            w.reason = "Bank not linked";
            continue;
        }

        try {
            // 🔒 Mark as processing first (prevents double payout)
            w.status = "processing";
            writeJSON(withdrawalsPath, withdrawals);

            const response = await axios.post(
                `${process.env.IMB_BASE_URL}/api/payout/create`,
                {
                    payout_id: "WDL_" + Date.now(),
                    amount: w.amount,
                    currency: "INR",
                    account_holder: bank.holder,
                    account_number: bank.number,
                    ifsc: bank.code,
                    bank_name: bank.bankName,
                    mobile: bank.mobile
                },
                {
                    headers: {
                        "X-API-KEY": process.env.IMB_API_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout: 15000
                }
            );

            if (response.data?.status === "SUCCESS") {
                w.status = "paid";
                w.paidAt = new Date().toISOString();
                w.gatewayRef = response.data.reference_id;
                console.log("✅ Paid:", w.userId, w.amount);
            } else {
                w.status = "failed";
                w.reason = "Gateway rejected";
            }

        } catch (err) {
            w.status = "failed";
            w.reason = err.message;
            console.error("❌ Payout failed:", err.message);
        }

        writeJSON(withdrawalsPath, withdrawals);
    }

    console.log("✅ AUTO PAYOUT RUN FINISHED");
}

processPayouts();

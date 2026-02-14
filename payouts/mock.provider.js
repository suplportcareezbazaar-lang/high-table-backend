/**
 * MOCK / MANUAL PAYOUT PROVIDER
 * Safe for testing & launch
 */

async function executePayout(withdrawal, bank) {
    // simulate network delay
    await new Promise(r => setTimeout(r, 800));

    return {
        success: true,
        ref: "MOCK_PAYOUT_" + Date.now(),
        raw: {
            bank: bank.bankName,
            last4: bank.number.slice(-4)
        }
    };
}

module.exports = { executePayout };

/**
 * Every payout provider MUST follow this interface
 * This keeps system gateway-agnostic
 */

async function executePayout(withdrawal, bank) {
    throw new Error("executePayout() not implemented");
}

module.exports = {
    executePayout
};

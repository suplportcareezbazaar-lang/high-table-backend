require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET,
    API_SPORTS_KEY: process.env.API_SPORTS_KEY,

    NODE_ENV: process.env.NODE_ENV || "development",

    BETTING_CLOSE_MINUTES: 30,

    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX: 100
    }
};

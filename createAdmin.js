require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {

    const hash = await bcrypt.hash("admin123", 10);

    await User.create({
        username: "admin",
        email: "admin@high-table.com",
        mobile: "0000000000",
        passwordHash: hash,
        role: "admin",
        approved: true
    });

    console.log("Admin created");
    process.exit();
});

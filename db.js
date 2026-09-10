const mongoose = require("mongoose");

// Optional DNS workaround for environments where SRV lookups to MongoDB
// Atlas fail with "querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net"
// (seen on some Windows setups). This is a local DNS resolver issue, not
// something Atlas Network Access settings fix, so it's opt-in only: set
// MONGODB_DNS_OVERRIDE=true in .env if you actually hit that error.
// Default behavior uses the system's normal DNS configuration.
if (process.env.MONGODB_DNS_OVERRIDE === "true") {
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
};

module.exports = {
    connectDB
};
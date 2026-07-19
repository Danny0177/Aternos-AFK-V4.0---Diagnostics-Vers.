// ==================================================
// AFK BOT v4.0 — Deep Diagnostic Edition
// ==================================================

const http = require("http");
const mineflayer = require("mineflayer");
const settings = require("./settings.json");

const Diagnostics = require("./diagnostics");
const ReconnectController = require("./reconnect");

// --------------------------------------------------
// Version banner
// --------------------------------------------------

console.log("==================================================");
console.log("        AFK BOT v4.0 — Deep Diagnostic Mode        ");
console.log("==================================================");

// --------------------------------------------------
// HTTP server for Railway health checks
// --------------------------------------------------

const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("AFK bot is running");
}).listen(PORT);

// --------------------------------------------------
// Global state
// --------------------------------------------------

let bot = null;
let spawnTimeout = null;
let activityInterval = null;

// --------------------------------------------------
// Create bot
// --------------------------------------------------

function createBot() {
    Diagnostics.banner("Creating bot instance");

    bot = mineflayer.createBot({
        host: settings.server.host,
        port: settings.server.port,
        username: settings.account.username,
        version: settings.server.version,
        hideErrors: false
    });

    Diagnostics.attachBot(bot);
    ReconnectController.attachBot(bot);

    // --------------------------------------------------
    // Spawn timeout
    // --------------------------------------------------

    spawnTimeout = setTimeout(() => {
        Diagnostics.section("Spawn Timeout");
        Diagnostics.log("Spawn not reached within 180 seconds");
        Diagnostics.log("Destroying connection and retrying");

        try { bot.end(); } catch {}
        ReconnectController.schedule("spawn timeout");

    }, 180000);

    // --------------------------------------------------
    // Spawn success
    // --------------------------------------------------

    bot.once("spawn", () => {
        clearTimeout(spawnTimeout);
        ReconnectController.resetDelay();

        Diagnostics.section("Spawn Reached");
        Diagnostics.log("Bot successfully entered the world");

        // Optional login command
        if (settings.loginCommand) {
            setTimeout(() => {
                try {
                    Diagnostics.log("Sending login command");
                    bot.chat(settings.loginCommand);
                } catch (e) {
                    Diagnostics.log("Login command failed: " + e.message);
                }
            }, 3000);
        }

        // Anti-idle heartbeat
        activityInterval = setInterval(() => {
            try {
                bot.look(bot.entity.yaw + 0.05, bot.entity.pitch, true);
                Diagnostics.log("Heartbeat tick");
            } catch (e) {
                Diagnostics.log("Heartbeat failed: " + e.message);
            }
        }, settings.activity.interval || 300000);
    });

    // --------------------------------------------------
    // Disconnects
    // --------------------------------------------------

    bot.on("end", reason => {
        clearTimeout(spawnTimeout);
        clearInterval(activityInterval);

        Diagnostics.section("End Event");
        Diagnostics.log("Connection ended: " + reason);

        ReconnectController.schedule("end event");
    });

    bot.on("kicked", reason => {
        Diagnostics.section("Kicked");
        Diagnostics.log("Server kicked the bot:");
        console.log(reason);
    });

    bot.on("error", err => {
        Diagnostics.section("Error");
        Diagnostics.log("Error: " + err.message);

        ReconnectController.schedule("error");
    });
}

// --------------------------------------------------
// Start bot
// --------------------------------------------------

createBot();

// Export for reconnect.js
module.exports = { createBot };

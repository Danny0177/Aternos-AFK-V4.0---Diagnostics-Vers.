// ==================================================
// index.js — AFK Bot with Lightweight Heartbeat
// ==================================================

const mineflayer = require('mineflayer');
const settings = require('./settings.json');
const diagnostics = require('./diagnostics.js');

let bot;
let reconnectTimeout = null;

// ==================================================
// Create Bot
// ==================================================

function createBot() {
    console.log("==================================================");
    console.log(`[${new Date().toLocaleTimeString()}] Creating bot instance`);
    console.log("==================================================");

    bot = mineflayer.createBot({
    host: settings.server.host,
    port: settings.server.port,
    username: settings.account.username,
    version: settings.server.version //Should be set to a compatible version with current mineflayer in settings.json
});


    diagnostics.attachBot(bot);

    bot.on('spawn', () => {
        console.log(`[${new Date().toLocaleTimeString()}] Bot spawned successfully`);
        startHeartbeat();
    });

    bot.on('end', () => {
        console.log("==================================================");
        console.log(`[${new Date().toLocaleTimeString()}] End Event`);
        console.log("==================================================");
        scheduleReconnect("socketClosed");
    });

    bot.on('error', (err) => {
        console.log("==================================================");
        console.log(`[${new Date().toLocaleTimeString()}] Error`);
        console.log(err);
        console.log("==================================================");
        scheduleReconnect("error");
    });
}

// ==================================================
// Reconnect Logic
// ==================================================

function scheduleReconnect(reason) {
    if (reconnectTimeout) {
        console.log(`[${new Date().toLocaleTimeString()}] [Reconnect] Already scheduled, ignoring duplicate`);
        return;
    }

    const delay = reason === "error" ? 20000 : 10000;
    console.log(`[${new Date().toLocaleTimeString()}] [Reconnect] Scheduling reconnect in ${delay / 1000}s (${reason})`);

    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        console.log("==================================================");
        console.log(`[${new Date().toLocaleTimeString()}] Reconnect`);
        console.log("==================================================");
        console.log(`[${new Date().toLocaleTimeString()}] Reconnecting now...`);
        createBot();
    }, delay);
}

// ==================================================
// Lightweight Heartbeat (AFK‑Proof)
// ==================================================

function heartbeat() {
    if (!bot || !bot.entity) return;

    // 1. Tiny head turn
    const yaw = bot.entity.yaw + (Math.random() * 0.2 - 0.1);
    const pitch = bot.entity.pitch + (Math.random() * 0.1 - 0.05);
    bot.look(yaw, pitch, true);

    // 2. Swing arm (punch air)
    bot.swingArm("right");

    // 3. Sneak pulse
    bot.setControlState("sneak", true);
    setTimeout(() => bot.setControlState("sneak", false), 300);
}

function startHeartbeat() {
    console.log(`[${new Date().toLocaleTimeString()}] Heartbeat started (20s interval)`);
    setInterval(() => heartbeat(), 20000);
}

// ==================================================
// Start Bot
// ==================================================

createBot();

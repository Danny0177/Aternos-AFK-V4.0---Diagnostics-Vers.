// ==================================================
// reconnect.js — Exponential backoff + protection
// ==================================================

const settings = require("./settings.json");
const Diagnostics = require("./diagnostics");

let reconnectTimer = null;
let reconnectDelay = settings.reconnect.initialDelay;
let botRef = null;

module.exports = {
    attachBot(bot) {
        botRef = bot;
    },

    schedule(reason = "unknown") {
        if (reconnectTimer) {
            Diagnostics.log("[Reconnect] Already scheduled, ignoring duplicate");
            return;
        }

        Diagnostics.log(`[Reconnect] Scheduling reconnect in ${reconnectDelay / 1000}s (${reason})`);

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            reconnectDelay = Math.min(reconnectDelay * 2, settings.reconnect.maxDelay);

            Diagnostics.section("Reconnect");
            Diagnostics.log("Reconnecting now...");

            require("./index").createBot();
        }, reconnectDelay);
    },

    resetDelay() {
        reconnectDelay = settings.reconnect.initialDelay;
        Diagnostics.log("[Reconnect] Delay reset");
    }
};

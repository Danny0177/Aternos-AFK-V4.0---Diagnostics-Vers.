// ==================================================
// diagnostics.js — Direct CONFIGURATION detection
// ==================================================

module.exports = {
    log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    },

    section(title) {
        console.log("==================================================");
        this.log(title);
        console.log("==================================================");
    },

    banner(title) {
        console.log("==================================================");
        this.log(title);
        console.log("==================================================");
    },

    attachBot(bot) {
        // --------------------------------------------------
        // Basic connection stages
        // --------------------------------------------------

        bot.on("connect", () => this.log("[Stage] TCP connected"));
        bot.on("inject_allowed", () => this.log("[Stage] Protocol injected"));
        bot.on("login", () => this.log("[Stage] Login packet received"));
        bot.on("game", () => this.log("[Stage] Game state received"));
        bot.on("respawn", () => this.log("[Stage] Respawn event fired"));

        // --------------------------------------------------
        // Resource pack logging ONLY — no accept/reject
        // --------------------------------------------------

        bot.on("resourcePack", (url, hash) => {
            this.section("Resource Pack");
            this.log("Request received");
            this.log("URL: " + url);
            this.log("Hash: " + hash);
            this.log("NOTE: No accept/reject sent (safe mode for 1.20+)");
        });

        // --------------------------------------------------
        // Direct CONFIGURATION detection + finish_configuration
        // --------------------------------------------------

        const client = bot._client;
        if (!client) return;

        let configFinished = false;

        client.on("packet", (data, meta) => {
            const important = [
                "login",
                "success",
                "join_game",
                "respawn",
                "disconnect",
                "resource_pack_send",
                "resource_pack",
                "custom_payload",
                "plugin_message",
                "registry_data",
                "feature_flags",
                "data_packs",
                "finish_configuration"
            ];

            if (important.includes(meta.name)) {
                this.log(`[Packet] ${meta.name}`);
            }

            // Detect CONFIGURATION state packets
            if (!configFinished && (
                meta.name === "registry_data" ||
                meta.name === "feature_flags" ||
                meta.name === "data_packs"
            )) {
                this.section("Configuration Detected");
                this.log("Configuration packets received (" + meta.name + ")");
                this.log("Sending finish_configuration immediately (direct detection)");

                try {
                    client.write("finish_configuration", {});
                    configFinished = true;
                    this.log("[Config] finish_configuration sent");
                } catch (e) {
                    this.log("[Config] Failed to send finish_configuration: " + e.message);
                }
            }
        });

        client.on("success", () => {
            this.log("[Protocol] Login success packet received");
        });

        client.on("disconnect", packet => {
            this.section("Disconnect Packet");
            console.log(packet);
        });

        // --------------------------------------------------
        // Socket diagnostics
        // --------------------------------------------------

        if (client.socket) {
            client.socket.on("timeout", () => this.log("[Socket] Timeout"));
            client.socket.on("close", hadError => this.log(`[Socket] Closed (hadError=${hadError})`));
            client.socket.on("error", err => this.log("[Socket] Error: " + err.message));
        }
    }
};

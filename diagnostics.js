// ==================================================
// diagnostics.js — Compact Deep Logging
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
        // Basic connection stages
        bot.on("connect", () => this.log("[Stage] TCP connected"));
        bot.on("inject_allowed", () => this.log("[Stage] Protocol injected"));
        bot.on("login", () => this.log("[Stage] Login packet received"));
        bot.on("game", () => this.log("[Stage] Game state received"));
        bot.on("respawn", () => this.log("[Stage] Respawn event fired"));

        // --------------------------------------------------
        // Resource pack REJECTION (correct protocol packet)
        // --------------------------------------------------

        bot.on("resourcePack", (url, hash) => {
            this.section("Resource Pack");
            this.log("Request received");
            this.log("URL: " + url);
            this.log("Hash: " + hash);

            try {
                this.log("Rejecting resource pack (protocol packet)");
                bot._client.write('resource_pack_receive', {
                    result: 1 // 1 = declined
                });
            } catch (e) {
                this.log("Resource pack reject failed: " + e.message);
            }
        });

        // --------------------------------------------------
        // Deep protocol logging
        // --------------------------------------------------

        const client = bot._client;
        if (!client) return;

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
                "plugin_message"
            ];

            if (important.includes(meta.name)) {
                this.log(`[Packet] ${meta.name}`);
            }
        });

        client.on("resource_pack_send", packet => {
            this.log("[Packet] resource_pack_send");
            console.log(packet);
        });

        client.on("resource_pack_receive", packet => {
            this.log("[Packet] resource_pack_receive");
            console.log(packet);
        });

        client.on("success", () => {
            this.log("[Protocol] Login success packet received");
        });

        client.on("disconnect", packet => {
            this.section("Disconnect Packet");
            console.log(packet);
        });

        // Socket diagnostics
        if (client.socket) {
            client.socket.on("timeout", () => this.log("[Socket] Timeout"));
            client.socket.on("close", hadError => this.log(`[Socket] Closed (hadError=${hadError})`));
            client.socket.on("error", err => this.log("[Socket] Error: " + err.message));
        }
    }
};


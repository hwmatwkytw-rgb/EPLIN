module.exports = {
    config: {
        name: "مافيا",
        version: "6.0",
        author: "🔥 احترافي",
        countDown: 5,
        role: 0,
        prefix: true,
        description: "مافيا احترافية",
        category: "games"
    },

    onReply: async ({ api, event, handleReply }) => {
        const { threadID, senderID, body } = event;
        const game = global.mafia[threadID];
        if (!game) return;

        try {
            // ===== الانضمام =====
            if (handleReply.type === "join") {

                if (body === "انضم") {
                    if (game.players.includes(senderID)) {
                        return api.sendMessage("❌ انت داخل.", threadID);
                    }

                    game.players.push(senderID);
                    game.points[senderID] = 0;

                    return api.sendMessage(`✅ العدد: ${game.players.length}`, threadID);
                }

                if (body === "بدء" && senderID === game.host) {

                    if (game.players.length < 6) {
                        return api.sendMessage("❌ لازم 6 لاعبين.", threadID);
                    }

                    game.alive = [...game.players];
                    game.roles = {};
                    game.votes = {};
                    game.nightActions = {};

                    const shuffled = [...game.players].sort(() => 0.5 - Math.random());

                    game.roles[shuffled[0]] = "مافيا";
                    game.roles[shuffled[1]] = "مافيا";
                    game.roles[shuffled[2]] = "دكتور";
                    game.roles[shuffled[3]] = "شرطة";
                    game.roles[shuffled[4]] = "قاتل";
                    game.roles[shuffled[5]] = "قناص";

                    if (shuffled[6]) game.roles[shuffled[6]] = "ساحر";

                    for (let i = 7; i < shuffled.length; i++) {
                        game.roles[shuffled[i]] = "مواطن";
                    }

                    game.mafiaBoss = shuffled[0];

                    // إرسال الأدوار
                    for (let id of game.players) {
                        let role = game.roles[id];
                        if (id === game.mafiaBoss) role += " 👑";
                        api.sendMessage(`🎭 دورك: ${role}`, id);
                    }

                    return startNight(api, threadID);
                }
            }

            // ===== شات المافيا =====
            if (body.startsWith("م ")) {
                if (game.roles[senderID] !== "مافيا") return;

                const msg = body.slice(2);

                game.alive.forEach(id => {
                    if (game.roles[id] === "مافيا" && id !== senderID) {
                        api.sendMessage(`💬 مافيا: ${msg}`, id);
                    }
                });
            }

            // ===== الليل =====
            if (handleReply.type === "night") {

                if (!game.alive.includes(senderID)) return;
                if (isNaN(body)) return;

                const num = parseInt(body);
                const target = game.alive[num - 1];
                if (!target) return;

                const role = game.roles[senderID];

                // منع التكرار
                if (game.nightActions[senderID]) {
                    return api.sendMessage("❌ اخترت بالفعل.", senderID);
                }

                game.nightActions[senderID] = {
                    role,
                    target
                };

                api.sendMessage("✔ تم اختيارك.", senderID);
            }

            // ===== التصويت =====
            if (handleReply.type === "vote") {

                if (!game.alive.includes(senderID)) return;
                if (isNaN(body)) return;

                const num = parseInt(body);
                const target = game.alive[num - 1];
                if (!target) return;

                game.votes[senderID] = target;

                api.sendMessage("🗳 صوتك تم.", threadID);

                if (Object.keys(game.votes).length === game.alive.length) {
                    endVote(api, threadID);
                }
            }

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ خطأ.", threadID);
        }
    },

    onStart: async ({ api, event }) => {
        const { threadID, senderID } = event;

        if (!global.mafia) global.mafia = {};
        if (global.mafia[threadID]) {
            return api.sendMessage("⚠️ في لعبة شغالة.", threadID);
        }

        global.mafia[threadID] = {
            host: senderID,
            players: [],
            roles: {},
            alive: [],
            votes: {},
            nightActions: {},
            mafiaBoss: null,
            points: {}
        };

        api.sendMessage(
            "🎭 لعبة المافيا\n\nاكتب (انضم)\nاكتب (بدء)",
            threadID,
            (err, info) => {
                global.client.handleReply.push({
                    name: "مافيا",
                    messageID: info.messageID,
                    author: senderID,
                    type: "join"
                });
            }
        );
    }
};

// ===== وظائف =====

function startNight(api, threadID) {
    const game = global.mafia[threadID];
    game.nightActions = {};

    let list = "🌙 الليل - اختر رقم:\n";
    game.alive.forEach((id, i) => list += `${i + 1}\n`);

    api.sendMessage(list, threadID, (err, info) => {
        global.client.handleReply.push({
            name: "مافيا",
            messageID: info.messageID,
            type: "night"
        });
    });

    setTimeout(() => endNight(api, threadID), 25000);
}

function endNight(api, threadID) {
    const game = global.mafia[threadID];

    let votes = {};
    let saved = null;

    for (let id in game.nightActions) {
        const action = game.nightActions[id];

        if (action.role === "دكتور") {
            saved = action.target;
        }

        if (["مافيا", "قاتل", "قناص"].includes(action.role)) {
            let weight = (id == game.mafiaBoss) ? 2 : 1;
            votes[action.target] = (votes[action.target] || 0) + weight;
        }
    }

    let max = 0, target = null;
    for (let id in votes) {
        if (votes[id] > max) {
            max = votes[id];
            target = id;
        }
    }

    if (target && target !== saved) {
        game.alive = game.alive.filter(x => x !== target);
        api.sendMessage("💀 مات لاعب.", threadID);
    } else {
        api.sendMessage("✨ تم الإنقاذ.", threadID);
    }

    checkWin(api, threadID);
    startDay(api, threadID);
}

function startDay(api, threadID) {
    const game = global.mafia[threadID];
    game.votes = {};

    let list = "☀️ النهار - صوت:\n";
    game.alive.forEach((id, i) => list += `${i + 1}\n`);

    api.sendMessage(list, threadID, (err, info) => {
        global.client.handleReply.push({
            name: "مافيا",
            messageID: info.messageID,
            type: "vote"
        });
    });
}

function endVote(api, threadID) {
    const game = global.mafia[threadID];

    let count = {};
    for (let id in game.votes) {
        let weight = (id == game.mafiaBoss) ? 2 : 1;
        count[game.votes[id]] = (count[game.votes[id]] || 0) + weight;
    }

    let max = 0, target = null;
    for (let id in count) {
        if (count[id] > max) {
            max = count[id];
            target = id;
        }
    }

    game.alive = game.alive.filter(id => id !== target);
    api.sendMessage("⚖️ تم الإعدام.", threadID);

    checkWin(api, threadID);
    startNight(api, threadID);
}

function checkWin(api, threadID) {
    const game = global.mafia[threadID];

    const mafia = game.alive.filter(id => game.roles[id] === "مافيا").length;
    const others = game.alive.length - mafia;

    if (mafia === 0) {
        api.sendMessage("🏆 فاز الشعب!", threadID);
        delete global.mafia[threadID];
    }

    if (mafia >= others) {
        api.sendMessage("🏆 فازت المافيا!", threadID);
        delete global.mafia[threadID];
    }
}

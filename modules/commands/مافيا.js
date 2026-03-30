module.exports = {
    config: {
        name: "مافيا",
        version: "Legend-1.0",
        author: "🔥 Ultimate Dev",
        countDown: 5,
        role: 0,
        prefix: true,
        description: "مافيا أسطورية + خرائط + تكتيك + أحداث + AI",
        category: "games"
    },

    onStart: async ({ api, event }) => {
        const { threadID, senderID } = event;

        if (!global.mafia) global.mafia = {};
        if (global.mafia[threadID])
            return api.sendMessage("⚠️ لعبة شغالة بالفعل", threadID);

        global.mafia[threadID] = {
            host: senderID,
            players: [],
            alive: [],
            roles: {},
            votes: {},
            points: {},
            wins: {},
            bank: {},
            items: {},
            tactics: {},
            missions: {},
            map: null,
            spy: null
        };

        api.sendMessage(
`🎭 لعبة المافيا الأسطورية

اكتب:
- انضم
- بدء
- متجر
- بنك
- ترتيب
- عالمي
- انهاء`,
        threadID,
        (err, info) => {
            global.client.handleReply.push({
                name: "مافيا",
                messageID: info.messageID,
                type: "join"
            });
        });
    },

    onReply: async ({ api, event, handleReply }) => {
        const { threadID, senderID, body } = event;
        const game = global.mafia?.[threadID];
        if (!game) return;

        try {

            // ================= JOIN =================
            if (handleReply.type === "join") {

                if (body === "انضم") {
                    if (game.players.includes(senderID))
                        return api.sendMessage("❌ داخل مسبقاً", threadID);

                    game.players.push(senderID);
                    game.points[senderID] = 5;
                    game.wins[senderID] = 0;
                    game.bank[senderID] = 0;
                    game.items[senderID] = { shield: 0, bullet: 0, info: 0 };

                    return api.sendMessage("✅ تم الانضمام", threadID);
                }

                // ================= START =================
                if (body === "بدء" && senderID === game.host) {

                    if (game.players.length < 6)
                        return api.sendMessage("❌ لازم 6 لاعبين", threadID);

                    game.alive = [...game.players];

                    const shuffled = [...game.players].sort(() => 0.5 - Math.random());

                    game.roles = {};
                    game.roles[shuffled[0]] = "مافيا";
                    game.roles[shuffled[1]] = "مافيا";
                    game.roles[shuffled[2]] = "دكتور";
                    game.roles[shuffled[3]] = "شرطة";
                    game.roles[shuffled[4]] = "قاتل";
                    game.roles[shuffled[5]] = "قناص";

                    for (let i = 6; i < shuffled.length; i++)
                        game.roles[shuffled[i]] = "مواطن";

                    // 🗺 MAP
                    const maps = ["🏙 المدينة", "🏚 الحي الشعبي", "🏢 الحكومة", "🌑 الظلام"];
                    game.map = maps[Math.floor(Math.random() * maps.length)];

                    // 🕵️ SPY
                    game.spy = game.players[Math.floor(Math.random() * game.players.length)];
                    api.sendMessage("🕵️ أنت الجاسوس", game.spy);

                    // 🎭 ROLES DM
                    for (let id of game.players) {
                        api.sendMessage(`🎭 دورك: ${game.roles[id]}`, id).catch(() => {});
                    }

                    api.sendMessage(`🗺 الخريطة: ${game.map}`, threadID);

                    return startNight(api, threadID);
                }

                // ================= SHOP =================
                if (body === "متجر") {
                    return api.sendMessage(
`🛒 متجر:
1 🛡 درع = 5
2 🔫 رصاصة = 7
3 🔍 معلومة = 4`,
                    threadID,
                    (err, info) => {
                        global.client.handleReply.push({
                            name: "مافيا",
                            messageID: info.messageID,
                            type: "shop"
                        });
                    });
                }

                // ================= LEADER =================
                if (body === "ترتيب") {

                    let list = Object.entries(game.wins)
                        .sort((a,b)=>b[1]-a[1])
                        .slice(0,10)
                        .map((x,i)=>`${i+1}- ${x[0]} | 🏆 ${x[1]}`)
                        .join("\n");

                    return api.sendMessage("🏆 ترتيب:\n\n"+(list||"فارغ"), threadID);
                }

                // ================= GLOBAL =================
                if (body === "عالمي") {

                    let list = Object.entries(global.mafiaGlobal?.players || {})
                        .sort((a,b)=>b[1]-a[1])
                        .slice(0,10)
                        .map((x,i)=>`${i+1}- ${x[0]} | 🌍 ${x[1]}`)
                        .join("\n");

                    return api.sendMessage("🌍 عالمي:\n\n"+(list||"فارغ"), threadID);
                }

                // ================= END =================
                if (body === "انهاء" && senderID === game.host) {
                    delete global.mafia[threadID];
                    return api.sendMessage("🛑 انتهت اللعبة", threadID);
                }
            }

            // ================= SHOP LOGIC =================
            if (handleReply.type === "shop") {

                let p = game.points[senderID];

                if (body === "1" && p >= 5) {
                    game.points[senderID] -= 5;
                    game.items[senderID].shield++;
                    return api.sendMessage("🛡 تم شراء درع", threadID);
                }

                if (body === "2" && p >= 7) {
                    game.points[senderID] -= 7;
                    game.items[senderID].bullet++;
                    return api.sendMessage("🔫 تم شراء رصاصة", threadID);
                }

                if (body === "3" && p >= 4) {
                    game.points[senderID] -= 4;
                    game.items[senderID].info++;
                    return api.sendMessage("🔍 معلومة جاهزة", threadID);
                }

                return api.sendMessage("❌ خطأ أو نقاط غير كافية", threadID);
            }

        } catch (e) {
            console.log(e);
            api.sendMessage("❌ خطأ", threadID);
        }
    }
};

// ================= FUNCTIONS =================

function startNight(api, threadID) {
    const game = global.mafia[threadID];

    // ⚡ EVENT
    const events = [
        "🌩 انقطاع كهرباء",
        "💣 انفجار",
        "🕵️ كشف لاعب",
        "🧟 فوضى",
        "🔇 صمت"
    ];

    let event = events[Math.floor(Math.random()*events.length)];
    api.sendMessage(`⚠️ حدث: ${event}`, threadID);

    setTimeout(()=>aiBalance(game), 2000);

    let list = "🌙 الليل\n";
    game.alive.forEach((id,i)=>list+=`${i+1}\n`);

    api.sendMessage(list, threadID);
}

// ================= AI BALANCE =================
function aiBalance(game) {
    let mafia = game.alive.filter(x=>game.roles[x]==="مافيا").length;
    let civ = game.alive.length - mafia;

    if (mafia > civ) {
        game.alive.forEach(id=>{
            if(game.roles[id]!=="مافيا") game.points[id] += 1;
        });
    }
                                   }

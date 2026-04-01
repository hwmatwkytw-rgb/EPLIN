module.exports = {
    config: {
        name: "متمرد",
        version: "4.0.0",
        author: "Fix AI + ChatGPT",
        countDown: 3,
        role: 0,
        description: "لعبة متمرد: متجر + عملة + رتب + ذكاء تلقائي",
        category: "game"
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        global.mutamaridGame = global.mutamaridGame || {};
        global.userData = global.userData || {};
        global.shop = {
            "درع": 20,
            "كشف": 25,
            "رصاصة": 30,
            "إنقاذ": 25,
            "تبديل": 40
        };

        // 👤 إنشاء مستخدم
        if (!global.userData[threadID]) global.userData[threadID] = {};

        let text = args.join(" ").toLowerCase();

        // 🏪 عرض المتجر
        if (text.includes("متجر")) {

            let msg = "🏪 متجر متمرد 💎\n\n";

            for (let i in global.shop) {
                msg += `🛒 ${i} ➜ ${global.shop[i]} 💎\n`;
            }

            return api.sendMessage(msg, threadID, messageID);
        }

        // 🎮 بدء لعبة
        if (text.includes("بدء") || text.includes("لعبة")) {

            global.mutamaridGame[threadID] = {
                active: true
            };

            return api.sendMessage("🎮 تم بدء لعبة متمرد!", threadID, messageID);
        }

        return api.sendMessage("🧠 اكتب: متجر أو بدء", threadID, messageID);
    },

    onChat: async ({ api, event }) => {
        const { threadID, senderID, body } = event;

        if (!body) return;
        if (!global.mutamaridGame || !global.mutamaridGame[threadID]) return;

        global.userData = global.userData || {};
        global.shop = global.shop || {
            "درع": 20,
            "كشف": 25,
            "رصاصة": 30,
            "إنقاذ": 25,
            "تبديل": 40
        };

        if (!global.userData[threadID]) global.userData[threadID] = {};
        let user = global.userData[threadID][senderID];

        // 👤 إنشاء لاعب
        if (!user) {
            global.userData[threadID][senderID] = {
                coins: 10,
                rank: "🆕 مبتدئ",
                items: {}
            };
            user = global.userData[threadID][senderID];
        }

        let text = body.toLowerCase();

        // 💎 ربح تلقائي
        if (text.includes("ربح") || text.includes("فلوس")) {

            let earn = Math.floor(Math.random() * 20) + 5;

            user.coins += earn;

            let rank =
                user.coins >= 500 ? "👑 أسطورة" :
                user.coins >= 300 ? "🔥 محترف" :
                user.coins >= 150 ? "⭐ قوي" :
                user.coins >= 50 ? "⚡ نشيط" :
                "🆕 مبتدئ";

            user.rank = rank;

            return api.sendMessage(
                `💎 ربحت ${earn} عملة!\n🎖️ رتبتك: ${rank}`,
                threadID
            );
        }

        // 🛒 شراء ذكي
        if (text.includes("أشتري") || text.includes("اشتري")) {

            let item = null;

            for (let i in global.shop) {
                if (text.includes(i)) {
                    item = i;
                    break;
                }
            }

            if (!item) return;

            if (user.coins < global.shop[item]) {
                return api.sendMessage("❌ ما عندك 💎 كافي", threadID);
            }

            user.coins -= global.shop[item];
            user.items[item] = (user.items[item] || 0) + 1;

            return api.sendMessage(`✅ اشتريت ${item}`, threadID);
        }

        // 👤 بروفايل
        if (text.includes("بروفايل") || text.includes("حسابي")) {

            return api.sendMessage(
`👤 حسابك:

💎 العملات: ${user.coins}
🎖️ الرتبة: ${user.rank}`,
                threadID
            );
        }
    }
};

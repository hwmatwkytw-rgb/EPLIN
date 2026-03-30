module.exports = {
    config: {
        name: "لغز",
        version: "4.0.0",
        author: "Fix Pro",
        countDown: 3,
        role: 0,
        description: "نظام ألغاز + بطولات + ترتيب عالمي للجروبات",
        category: "game"
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;

        global.riddleGame = global.riddleGame || {};
        global.userPoints = global.userPoints || {};
        global.groupPoints = global.groupPoints || {};
        global.groupWins = global.groupWins || {};

        const riddles = [
            { q: "شيء يمشي بدون أرجل؟", a: "الريح", level: "easy" },
            { q: "شيء كلما أخذت منه كبر؟", a: "الحفرة", level: "medium" },
            { q: "شيء إذا نقص كبر؟", a: "العمر", level: "hard" }
        ];

        // 🏆 عرض ترتيب عالمي للجروبات
        if (args[0] === "ترتيب") {

            let sorted = Object.entries(global.groupPoints)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (sorted.length === 0) {
                return api.sendMessage("📉 لا يوجد ترتيب بعد", threadID);
            }

            let msg = "🌍🏆 الترتيب العالمي للجروبات:\n\n";

            sorted.forEach((g, i) => {
                msg += `${i + 1}- 🏠 جروب ${g[0]} | ${g[1]} نقطة\n`;
            });

            return api.sendMessage(msg, threadID);
        }

        // 🥊 بدء بطولة بين جروب وجروب
        if (args[0] === "بطولة") {

            let r = riddles[Math.floor(Math.random() * riddles.length)];

            global.riddleGame[threadID] = {
                answer: r.a,
                level: r.level,
                group: threadID
            };

            return api.sendMessage(
`🥊🏆 بطولة جروبات بدأت!

🧠 لغز (${r.level.toUpperCase()}):
❓ ${r.q}

💥 أول جروب يجيب صح يكسب النقاط!`,
                threadID,
                messageID
            );
        }

        // 🧠 لغز عادي
        let r = riddles[Math.floor(Math.random() * riddles.length)];

        global.riddleGame[threadID] = {
            answer: r.a,
            level: r.level,
            group: threadID
        };

        return api.sendMessage(
`🧠 لغز (${r.level.toUpperCase()})

❓ ${r.q}`,
            threadID,
            messageID
        );
    },

    onChat: async ({ api, event }) => {
        const { threadID, senderID, body } = event;

        if (!global.riddleGame || !global.riddleGame[threadID]) return;

        let game = global.riddleGame[threadID];

        if (!body) return;

        let answer = body.trim();

        global.userPoints = global.userPoints || {};
        global.groupPoints = global.groupPoints || {};
        global.groupWins = global.groupWins || {};

        // ❌ خطأ
        if (answer !== game.answer) {
            return;
        }

        // 🎉 صح
        delete global.riddleGame[threadID];

        // 🏆 نقاط اللاعب
        global.userPoints[senderID] =
            (global.userPoints[senderID] || 0) + 1;

        // 🏠 نقاط الجروب
        global.groupPoints[threadID] =
            (global.groupPoints[threadID] || 0) + 1;

        // 🏆 انتصارات الجروب
        global.groupWins[threadID] =
            (global.groupWins[threadID] || 0) + 1;

        let groupScore = global.groupPoints[threadID];

        // 🎖️ لقب الجروب
        let title = "جروب عادي";
        if (groupScore >= 10) title = "🔥 جروب قوي";
        if (groupScore >= 25) title = "🏆 جروب أسطوري";
        if (groupScore >= 50) title = "👑 أسطورة الجروبات";

        return api.sendMessage(
`🎉 إجابة صحيحة!

🏆 الجروب حصل على نقطة
📊 نقاط الجروب: ${groupScore}
🎖️ لقب الجروب: ${title}`,
            threadID
        );
    }
};

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'تحدي',
        version: '3.0',
        author: 'Fix Pro',
        countDown: 5,
        prefix: true,
        category: 'fun',
        description: 'تحدي بين شخصين + نقاط + تبادل أدوار',
        guide: {
            ar: '{pn} (رد على شخص)'
        }
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, senderID, messageReply } = event;

        global.duel = global.duel || {};
        global.points = global.points || {};

        // 👥 لازم رد على شخص
        if (!messageReply) {
            return api.sendMessage("❌ لازم ترد على شخص لبدء التحدي", threadID, messageID);
        }

        const player1 = senderID;
        const player2 = messageReply.senderID;

        if (player1 === player2) {
            return api.sendMessage("❌ ما تقدر تتحدّى نفسك 😂", threadID, messageID);
        }

        const challenges = [
            "😈 اكتب رسالة حب",
            "😂 قول نكتة",
            "🔥 اعترف بسر",
            "👀 مدح خصمك",
            "💀 قول شيء محرج",
            "😏 قول رأيك الصريح في خصمك"
        ];

        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

        const sent = await api.sendMessage(
`⏣────── ✾ ⌬ ✾ ──────⏣

👥 تحدي بين شخصين

🥊 اللاعب 1: ${player1}
🥊 اللاعب 2: ${player2}

🔥 التحدي:
${randomChallenge}

⏱️ لديك 20 ثانية

🔁 يبدأ اللاعب الأول

⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID,
            messageID
        );

        global.duel[threadID] = {
            p1: player1,
            p2: player2,
            turn: player1,
            challenge: randomChallenge,
            expire: Date.now() + 20000,
            messageID: sent.messageID
        };

        // ⏱️ انتهاء الوقت
        setTimeout(() => {
            if (global.duel[threadID]) {
                delete global.duel[threadID];

                api.unsendMessage(sent.messageID).catch(() => {});

                api.sendMessage("⏰ انتهى الوقت! تم إلغاء التحدي 💀", threadID);
            }
        }, 20000);
    },

    onReply: async ({ api, event }) => {
        const { threadID, messageID, senderID } = event;

        global.duel = global.duel || {};
        global.points = global.points || {};

        const game = global.duel[threadID];
        if (!game) return;

        // ❌ ليس دورك
        if (senderID !== game.turn) {
            return api.sendMessage("❌ ليس دورك الآن", threadID, messageID);
        }

        // 🏆 إضافة نقاط
        global.points[senderID] = (global.points[senderID] || 0) + 2;

        let pts1 = global.points[game.p1] || 0;
        let pts2 = global.points[game.p2] || 0;

        const winner = senderID;

        // ❌ حذف اللعبة بعد التنفيذ
        delete global.duel[threadID];

        api.unsendMessage(game.messageID).catch(() => {});

        return api.sendMessage(
`🏆 تم تنفيذ التحدي!

🔥 اللاعب الفائز بالنقطة: ${winner}

🎯 النقاط:
👤 اللاعب 1: ${pts1}
👤 اللاعب 2: ${pts2}

⏣────── ✾ ⌬ ✾ ──────⏣`,
            threadID,
            messageID
        );
    }
};

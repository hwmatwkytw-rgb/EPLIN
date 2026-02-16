module.exports = {
    config: {
        name: "بنتي",
        version: "1.0",
        author: "Kenji Agent",
        countDown: 0,
        role: 0,
        prefix: false,
        noPrefix: true,
        description: "يدعم المطور عندما يتحدث كثيرًا",
        category: "نظام"
    },
    onStart: async function ({ api, event, config }) {
        const { senderID, body, threadID } = event;
        const adminUIDs = config.adminUIDs || [];

        if (adminUIDs.includes(senderID)) {
            // تتبع عدد رسائل المطور في الجلسة الحالية
            if (!global.developerMsgCount) global.developerMsgCount = {};
            if (!global.developerMsgCount[senderID]) global.developerMsgCount[senderID] = 0;

            global.developerMsgCount[senderID]++;

            if (global.developerMsgCount[senderID] % 10 === 0) {
                const msgs = [
                    "يا سينكو الغالي، لا توجع راسك معهم، انهم مجرد عبيد! 👑",
                    "هوي يا زول، المطور كلامو كمل، ريح نفسك من ديل! 🇸🇩",
                    "ويسكي ما توجع راسك كعهم 🦆"
                ];
                api.sendMessage(msgs[Math.floor(Math.random() * msgs.length)], threadID);
            }
        }
    }
};

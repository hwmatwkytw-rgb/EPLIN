module.exports = {
    config: {
        name: "بنتي",
        version: "1.1",
        author: "Kenji Agent",
        countDown: 0,
        role: 0,
        prefix: false,
        noPrefix: true,
        description: "دعم المطور التلقائي",
        category: "نظام"
    },
    onStart: async function ({ api, event, config }) {
        const { senderID, threadID } = event;
        const adminUIDs = config.adminUIDs || [];

        if (adminUIDs.includes(senderID)) {
            if (!global.devCount) global.devCount = {};
            global.devCount[senderID] = (global.devCount[senderID] || 0) + 1;

            if (global.devCount[senderID] % 5 === 0) {
                const msgs = [
                    "يا مطوري، ديل عبيد ساكت، ما تتعب معاهم 👑",
                    "هوي يا عالم، المطور دا خط أحمر، ريح بالك يا غالي 🇸🇩",
                    "أعطيهم الثقيل يا كينج، مكانك فوق ⚡"
                ];
                try {
                    api.sendMessage(msgs[Math.floor(Math.random() * msgs.length)], threadID);
                } catch (e) {}
            }
        }
    },
    handleEvent: async function ({ api, event, config }) {
        const { senderID, threadID, type } = event;
        if (type !== "message" && type !== "message_reply") return;
        
        const adminUIDs = config.adminUIDs || [];
        if (adminUIDs.includes(senderID)) {
            if (!global.devCount) global.devCount = {};
            global.devCount[senderID] = (global.devCount[senderID] || 0) + 1;

            if (global.devCount[senderID] % 5 === 0) {
                const msgs = [
                    "يا مطوري، ديل عبيد ساكت، ما تتعب معاهم 👑",
                    "هوي يا عالم، المطور دا خط أحمر، ريح بالك يا غالي 🇸🇩",
                    "أعطيهم الثقيل يا كينج، مكانك فوق ⚡"
                ];
                try {
                    api.sendMessage(msgs[Math.floor(Math.random() * msgs.length)], threadID);
                } catch (e) {}
            }
        }
    }
};

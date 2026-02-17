module.exports = {
    config: {
        name: "اك",
        version: "2.1",
        author: "Kenji Agent",
        countDown: 10,
        role: 2,
        description: "طرد جميع الأعضاء بدون توقف",
        category: "المطور"
    },
    onStart: async function ({ api, event }) {
        const { threadID, senderID } = event;
        api.getThreadInfo(threadID, async (err, info) => {
            if (err) return api.sendMessage("❌ فشل جلب معلومات المجموعة.", threadID);
            const list = info.participantIDs.filter(id => id !== api.getCurrentUserID() && id !== senderID);
            api.sendMessage(`🚫 بدأت عملية تنظيف ${list.length} عضو. سيتم طردهم تباعاً...`, threadID);
            
            for (const id of list) {
                try {
                    await new Promise(resolve => {
                        api.removeUserFromGroup(id, threadID, (err) => {
                            resolve();
                        });
                    });
                    await new Promise(r => setTimeout(r, 700)); // تأخير بسيط جداً لضمان الاستمرار
                } catch (e) {
                    console.log(`Failed to kick ${id}`);
                }
            }
            api.sendMessage("✅ اكتملت عملية الطرد بنجاح.", threadID);
        });
    }
};

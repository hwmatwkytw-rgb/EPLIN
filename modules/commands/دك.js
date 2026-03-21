module.exports = {
    config: {
        name: "اك",
        version: "2.2",
        author: "Kenji Agent",
        countDown: 10,
        role: 2,
        description: "طرد جميع الأعضاء بدون توقف (للمطور فقط)",
        category: "المطور"
    },

    onStart: async function ({ api, event }) {
        const { threadID, senderID } = event;

        // 🔐 ايدي المطور المسموح له فقط
        const developerID = "100081948980908";

        // منع الاستخدام لغير المطور
        if (senderID !== developerID) {
            return api.sendMessage("❌ هذا الأمر مخصص للمطور فقط.", threadID);
        }

        api.getThreadInfo(threadID, async (err, info) => {
            if (err) return api.sendMessage("❌ فشل جلب معلومات المجموعة.", threadID);

            const list = info.participantIDs.filter(
                id => id !== api.getCurrentUserID() && id !== senderID
            );

            api.sendMessage(`🚫 بدأت عملية تنظيف ${list.length} عضو...`, threadID);

            for (const id of list) {
                try {
                    await new Promise(resolve => {
                        api.removeUserFromGroup(id, threadID, () => {
                            resolve();
                        });
                    });

                    await new Promise(r => setTimeout(r, 700)); // تأخير بسيط

                } catch (e) {
                    console.log(`Failed to kick ${id}`);
                }
            }

            api.sendMessage("✅ اكتملت عملية الطرد بنجاح.", threadID);
        });
    }
};

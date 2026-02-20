module.exports = {
    config: {
        name: "اختراق",
        version: "3.5",
        author: "سينكو",
        countDown: 5,
        role: 2,
        description: "محاكاة فحص أمني احترافي للحساب بزخرفة المسار الطولي.",
        category: "المطور"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;

        if (!args[0])
            return api.sendMessage(
                "●───── ⌬ ─────●\n" +
                "┇ ⚠️ مـنـشـن الـشـخص أو ضـع UID\n" +
                "●───── ⌬ ─────●", 
                threadID, messageID
            );

        const targetID = Object.keys(event.mentions)[0] || args[0];

        api.getUserInfo(targetID, async (err, userInfo) => {
            if (err || !userInfo[targetID])
                return api.sendMessage("❌ لم يتم العثور على المستخدم.", threadID);

            const name = userInfo[targetID].name;

            let progress = 0;
            const msg = await api.sendMessage(
                "●───── ⌬ ─────●\n" +
                "┇ 🛡️ بـدء فـحـص الأمـان...\n" +
                "┇ [░░░░░░░░░░] 0%\n" +
                "●───── ⌬ ─────●",
                threadID
            );

            while (progress < 100) {
                await new Promise(r => setTimeout(r, 600));
                progress += 20; // تسريع العملية قليلاً لتجربة مستخدم أفضل
                if (progress > 100) progress = 100;

                const filled = Math.floor(progress / 10);
                const bar = "▓".repeat(filled) + "░".repeat(10 - filled);

                api.editMessage(
                    `●───── ⌬ ─────●\n` +
                    `┇ 🛡️ فحص الحساب: ${name}\n` +
                    `┇ [${bar}] ${progress}%\n` +
                    `●───── ⌬ ─────●`,
                    msg.messageID
                );
            }

            const securityLevel = ["ضعيف", "متوسط", "جيد", "قوي", "محمي جداً"];
            const level = securityLevel[Math.floor(Math.random() * securityLevel.length)];

            const report = 
                `●───── ⌬ ─────●\n` +
                `┇ ⦿ ⟬ تـقـريـر الأمـان ⟭\n` +
                `┇\n` +
                `┇ 𓋰 الـمـسـتـخـدم: ${name}\n` +
                `┇ 𓋰 مـسـتوى الـحماية: ${level}\n` +
                `┇ 𓋰 الـمـصادقـة: ${Math.random() > 0.5 ? "مفعلة ✅" : "معطلة ❌"}\n` +
                `┇ 𓋰 نـشـاط مـشـبوه: ${Math.random() > 0.7 ? "تم رصد محاولة" : "لا يوجد"}\n` +
                `┇\n` +
                `┇ 𓋰 الـتـوصـيـة: ${level === "ضعيف" ? "فعل 2FA!" : "حسابك آمن."}\n` +
                `●───── ⌬ ─────●\n` +
                ` ⠇تـنـبيـه: فحص تـوعـوي فـقـط.`;

            api.sendMessage(report, threadID);
        });
    }
};

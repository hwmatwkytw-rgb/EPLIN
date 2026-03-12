module.exports = {
    config: {
        name: "قولي",
        version: "2.8",
        author: "سينكو & Gemini",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال إشعار للمجموعات - نسخة الإصلاح النهائي",
        category: "المطور",
        guide: { ar: "{pn}" }
    },

    onStart: async function ({ api, event, config }) {
        const { threadID, messageID, senderID } = event;

        if (!config.adminUIDs.includes(senderID)) {
            return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ هـذا الأمـر لـلـمـطـوࢪ فـقـط.\n●───── ✾ ⌬ ✾ ─────●", threadID);
        }

        try {
            const inbox = await api.getThreadList(20, null, ["INBOX"]);
            const groupList = inbox.filter(g => g.isGroup && g.threadID !== threadID);

            if (!groupList.length) {
                return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ لا تـوجد مـجموعات حـالياً.\n●───── ✾ ⌬ ✾ ─────●", threadID, messageID);
            }

            let msg = `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ⦿ ⟬ قـائمة الـمجموعات ⟭\n✾ ┇\n`;
            groupList.forEach((g, i) => {
                msg += `✾ ┇ ⟬ ${i + 1} ⟭ ❪ ${g.name || "مجموعة غير معروفة"} ❫\n`;
                if (i < groupList.length - 1) msg += `✾ ┇ ⸻⸻⸻⸻⸻\n`;
            });
            msg += `✾ ┇\n●───── ✾ ⌬ ✾ ─────●\n ⠇رد بـ الـرقم لاختيار المـجموعة`;

            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.error(err);
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    groupList: groupList,
                    step: 1 // حددنا المرحلة بوضوح
                });
            }, messageID);

        } catch (e) {
            api.sendMessage("❌ حدث خطأ في جلب القائمة.", threadID);
        }
    },

    onReply: async function ({ api, event, handleReply }) {
        const { body, threadID, messageID, senderID } = event;
        if (senderID !== handleReply.author) return;

        try {
            // المرحلة 1: اختيار المجموعة
            if (handleReply.step === 1) {
                const num = parseInt(body);
                const target = handleReply.groupList[num - 1];

                if (!target) return api.sendMessage("✾ ┇ ❌ الرقم خطأ، أعد المحاولة.", threadID, messageID);

                api.unsendMessage(handleReply.messageID);

                const askMsg = `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ✅ تـم اخـتـيار: ${target.name}\n✾ ┇\n✾ ┇ ✉️ رد الآن بـنـص الإشـعـار\n✾ ┇ الـذي تـود إرسـالـه.\n●───── ✾ ⌬ ✾ ─────●`;

                return api.sendMessage(askMsg, threadID, (err, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        targetID: target.threadID, // حفظ الـ ID هنا
                        targetName: target.name,
                        step: 2 // الانتقال للمرحلة 2
                    });
                }, messageID);
            }

            // المرحلة 2: إرسال النص الفعلي
            if (handleReply.step === 2) {
                const text = body;
                const destination = handleReply.targetID;

                const msgToGroup = 
                    `●───── ✾ ⌬ ✾ ─────●\n✾ ┇\n✾ ┇ ⦿ ⟬ 𓆩 الـمـطـور . اشـعـار 𓆪 ⟭\n✾ ┇\n✾ ┇ 📜 الـمـحـتـوى:\n✾ ┇ ➜ ${text}\n✾ ┇\n●───── ✾ ⌬ ✾ ─────●`;

                await api.sendMessage(msgToGroup, destination);
                
                api.unsendMessage(handleReply.messageID);
                return api.sendMessage(
                    `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ✅ تـم الإرسـال بـنـجـاح\n✾ ┇ ✦ الـمـسـتـلـم: ${handleReply.targetName}\n✾ ┇ ✦ الـحـالـة: تـم التـبـليـغ 📥\n●───── ✾ ⌬ ✾ ─────●`, 
                    threadID, messageID
                );
            }

        } catch (e) {
            api.sendMessage("❌ فشل في الإرسال، تأكد من وجود البوت هناك.", threadID);
        }
    }
};

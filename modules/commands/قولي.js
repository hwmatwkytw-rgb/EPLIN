module.exports = {
    config: {
        name: "قولي",
        version: "2.7",
        author: "سينكو & Gemini",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال إشعار للمجموعات عبر القائمة بنفس نظام الطلبات",
        category: "المطور",
        guide: { ar: "{pn}" }
    },

    onStart: async function ({ api, event, config }) {
        const { threadID, messageID, senderID } = event;

        // التحقق من المطور بنفس طريقتك في الطلبات
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

            msg += `✾ ┇\n●───── ✾ ⌬ ✾ ─────●\n`;
            msg += ` ⠇رد بـ الـرقم لاختيار المـجموعة`;

            api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.error(err);
                // التخزين بنفس نظام "الطلبات" اللي شغال عندك
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    groupList: groupList,
                    type: "chooseGroup"
                });
            }, messageID);

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ حدث خطأ في جلب القائمة.", threadID);
        }
    },

    onReply: async function ({ api, event, handleReply }) {
        const { body, threadID, messageID, senderID } = event;
        if (senderID !== handleReply.author) return;

        try {
            // المرحلة الأولى: اختيار المجموعة
            if (handleReply.type === "chooseGroup") {
                const num = parseInt(body);
                const targetGroup = handleReply.groupList[num - 1];

                if (!targetGroup) {
                    return api.sendMessage("✾ ┇ ❌ الرقم غير موجود في القائمة.", threadID, messageID);
                }

                api.unsendMessage(handleReply.messageID);

                const askMsg = `●───── ✾ ⌬ ✾ ─────●\n` +
                               `✾ ┇ ✅ تـم اخـتـيار: ${targetGroup.name}\n` +
                               `✾ ┇\n` +
                               `✾ ┇ ✉️ رد الآن بـنـص الإشـعـار\n` +
                               `✾ ┇ الـذي تـود إرسـالـه.\n` +
                               `●───── ✾ ⌬ ✾ ─────●`;

                return api.sendMessage(askMsg, threadID, (err, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        targetID: targetGroup.threadID,
                        targetName: targetGroup.name,
                        type: "sendText"
                    });
                }, messageID);
            }

            // المرحلة الثانية: إرسال النص
            if (handleReply.type === "sendText") {
                const text = body;
                
                const msgToGroup = 
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇\n` +
                    `✾ ┇ ⦿ ⟬ 𓆩   اشـعـار 𓆪 ⟭\n` +
                    `✾ ┇\n` +
                    `✾ ┇ 📜 الـمـحـتـوى:\n` +
                    `✾ ┇ ➜ ${text}\n` +
                    `✾ ┇\n` +
                    `●───── ✾ ⌬ ✾ ─────●`;

                await api.sendMessage(msgToGroup, handleReply.targetID);
                
                api.unsendMessage(handleReply.messageID);
                return api.sendMessage(
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇  تـم الإرسـال بـنـجـاح\n` +
                    `✾ ┇  الـمـسـتـلـم: ${handleReply.targetName}\n` +
                    `✾ ┇  الـحـالـة: تـم التـبـليـغ 📥\n` +
                    `●───── ✾ ⌬ ✾ ─────●`, 
                    threadID, messageID
                );
            }

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ حدث خطأ أثناء التنفيذ.", threadID);
        }
    }
};

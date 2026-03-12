module.exports = {
    config: {
        name: "قولي",
        version: "2.5",
        author: "سينكو & Gemini",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال إشعار للمجموعات عبر القائمة",
        category: "المطور",
        guide: { ar: "{pn}" }
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID } = event;

        try {
            const inbox = await api.getThreadList(20, null, ["INBOX"]);
            const groupList = inbox.filter(g => g.isGroup && g.threadID !== threadID);

            if (groupList.length === 0) {
                return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ لم يتم العثور على مجموعات\n●───── ✾ ⌬ ✾ ─────●", threadID, messageID);
            }

            let msg = `●───── ✾ ⌬ ✾ ─────●\n`;
            msg += `✾ ┇ 📱 قـائمة الـمجموعات:\n`;
            
            groupList.forEach((group, index) => {
                msg += `✾ ┇ ${index + 1} ➜ ${group.name || 'مجموعة بدون اسم'}\n`;
            });

            msg += `✾ ┇\n✾ ┇ 💡 رد عـلى هـذه الرسـالة برقم\n✾ ┇ الـمجموعة لاختيـارها.\n●───── ✾ ⌬ ✾ ─────●`;

            return api.sendMessage(msg, threadID, (err, info) => {
                if (err) return console.log(err);
                global.GoatBot.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    groupList,
                    type: "chooseGroup"
                });
            }, messageID);

        } catch (e) {
            return api.sendMessage("✾ ┇ حدث خطأ أثناء جلب المجموعات", threadID, messageID);
        }
    },

    onReply: async function ({ api, event, Reply }) {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== Reply.author) return;

        // المرحلة الأولى: اختيار المجموعة (بعد ما ترد بالرقم)
        if (Reply.type === "chooseGroup") {
            const index = parseInt(body);
            const group = Reply.groupList[index - 1];

            if (isNaN(index) || !group) {
                return api.sendMessage("✾ ┇ تنبيه: الرجاء كتابة رقم المجموعة بشكل صحيح.", threadID, messageID);
            }

            // حذف قائمة المجموعات القديمة عشان الشات ينظف
            api.unsendMessage(Reply.messageID);

            return api.sendMessage(
                `●───── ✾ ⌬ ✾ ─────●\n` +
                `✾ ┇ ✅ تـم اخـتـيار: ${group.name}\n` +
                `✾ ┇ ✉️ رد الآن بـنـص الإشـعـار\n` +
                `✾ ┇ الـذي تـود إرسـالـه.\n` +
                `●───── ✾ ⌬ ✾ ─────●`,
                threadID, (err, info) => {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        targetID: group.threadID,
                        targetName: group.name,
                        type: "sendText" // تحويل الحالة للمرحلة الثانية
                    });
                }, messageID);
        }

        // المرحلة الثانية: إرسال النص (بعد ما تكتب الكلام الداير ترسلوا)
        if (Reply.type === "sendText") {
            const text = body;
            const targetID = Reply.targetID;

            const msgToGroup = 
                `●───── ✾ ⌬ ✾ ─────●\n` +
                `✾ ┇\n` +
                `✾ ┇ ⦿ ⟬ 𓆩 الـمـطـور . اشـعـار 𓆪 ⟭\n` +
                `✾ ┇\n` +
                `✾ ┇  الـمـحـتـوى:\n` +
                `✾ ┇ ➜ ${text}\n` +
                `✾ ┇\n` +
                `●───── ✾ ⌬ ✾ ─────●`;

            api.sendMessage(msgToGroup, targetID, (err) => {
                if (err) {
                    return api.sendMessage(`✾ ┇ ❌ فشل الإرسال لـ ${Reply.targetName}`, threadID, messageID);
                }
                
                api.unsendMessage(Reply.messageID); // حذف رسالة "اكتب النص"
                return api.sendMessage(
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇ ✅ تـم الإرسـال بـنـجـاح\n` +
                    `✾ ┇  الـمـسـتـلـم: ${Reply.targetName}\n` +
                    `✾ ┇  الـحـالـة: تـم التـبـليـغ 📥\n` +
                    `●───── ✾ ⌬ ✾ ─────●`, 
                    threadID, messageID
                );
            });
        }
    }
};

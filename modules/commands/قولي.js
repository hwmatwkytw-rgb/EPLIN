module.exports = {
    config: {
        name: "قولي",
        version: "3.0",
        author: "سينكو",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال إشعار للمجموعات بنظام handleReply الموثوق.",
        category: "owner"
    },

    onReply: async ({ api, event, handleReply }) => {
        const { body, threadID, messageID, senderID } = event;
        
        // التحقق من أن صاحب الرد هو نفسه المطور
        if (senderID !== handleReply.author) return;

        try {
            // المرحلة الأولى: اختيار المجموعة
            if (handleReply.step === "choose") {
                const num = parseInt(body);
                const target = handleReply.groups[num - 1];

                if (!target) {
                    return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ الرقم غير موجود في القائمة.\n●───── ✾ ⌬ ✾ ─────●", threadID, messageID);
                }

                // مسح رسالة القائمة
                api.unsendMessage(handleReply.messageID);

                return api.sendMessage(
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇ ✅ تـم اخـتـيار: ${target.name}\n` +
                    `✾ ┇\n` +
                    `✾ ┇ ✉️ رد الآن بـنـص الإشـعـار\n` +
                    `✾ ┇ الـذي تـود إرسـالـه.\n` +
                    `●───── ✾ ⌬ ✾ ─────●`, 
                    threadID, (err, info) => {
                        // إضافة رد جديد للمرحلة الثانية
                        global.client.handleReply.push({
                            name: "قولي",
                            messageID: info.messageID,
                            author: senderID,
                            targetID: target.threadID,
                            targetName: target.name,
                            step: "send"
                        });
                    }, messageID);
            }

            // المرحلة الثانية: إرسال النص
            if (handleReply.step === "send") {
                const text = body;
                const destination = handleReply.targetID;

                const msgToGroup = 
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇\n` +
                    `✾ ┇ ⦿ ⟬ 𓆩 الـمـطـور . اشـعـار 𓆪 ⟭\n` +
                    `✾ ┇\n` +
                    `✾ ┇ 📜 الـمـحـتـوى:\n` +
                    `✾ ┇ ➜ ${text}\n` +
                    `✾ ┇\n` +
                    `●───── ✾ ⌬ ✾ ─────●`;

                await api.sendMessage(msgToGroup, destination);
                
                api.unsendMessage(handleReply.messageID);
                return api.sendMessage(
                    `●───── ✾ ⌬ ✾ ─────●\n` +
                    `✾ ┇ ✅ تـم الإرسـال بـنـجـاح\n` +
                    `✾ ┇ ✦ الـمـسـتـلـم: ${handleReply.targetName}\n` +
                    `✾ ┇ ✦ الـحـالـة: تـم التـبـليـغ 📥\n` +
                    `●───── ✾ ⌬ ✾ ─────●`, 
                    threadID, messageID
                );
            }

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ حدث خطأ أثناء التنفيذ.", threadID);
        }
    },

    onStart: async ({ api, event, config }) => {
        const { threadID, senderID, messageID } = event;

        if (!config.adminUIDs.includes(senderID)) {
            return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ هـذا الأمـر لـلـمـطـوࢪ فـقـط.\n●───── ✾ ⌬ ✾ ─────●", threadID);
        }

        const inbox = await api.getThreadList(20, null, ["INBOX"]);
        const groups = inbox.filter(t => t.isGroup && t.threadID !== threadID);

        if (!groups.length) {
            return api.sendMessage("●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ❌ لا تـوجـد مـجموعات حـالـيـاً.\n●───── ✾ ⌬ ✾ ─────●", threadID);
        }

        let msg = `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ ⦿ ⟬ قـائمة الـمجموعات ⟭\n✾ ┇\n`;

        groups.forEach((t, i) => {
            msg += `✾ ┇ ⟬ ${i + 1} ⟭ ❪ ${t.name || "مجموعة غير معروفة"} ❫\n`;
            if (i < groups.length - 1) msg += `✾ ┇ ⸻⸻⸻⸻⸻\n`;
        });

        msg += `✾ ┇\n●───── ✾ ⌬ ✾ ─────●\n`;
        msg += ` ⠇رد بـ الـرقم لاخـتـيـار المـجـمـوعة`;

        api.sendMessage(msg, threadID, (err, info) => {
            if (err) return console.error(err);
            global.client.handleReply.push({
                name: "قولي", // لازم يكون نفس الـ name في الـ config
                messageID: info.messageID,
                author: senderID,
                groups: groups,
                step: "choose"
            });
        }, messageID);
    }
};

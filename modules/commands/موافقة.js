module.exports = {
    config: {
        name: "موافقة",
        version: "6.6",
        author: "سينكو",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إدارة طلبات التفعيل",
        category: "owner",
        adminUIDs: ["100081948980908"]
    },

    onReply: async ({ api, event, handleReply }) => {
        const { body, threadID, messageID, senderID } = event;

        if (senderID !== handleReply.author) return;

        try {
            const args = body.trim().split(/\s+/);
            const num = parseInt(args[0]); // ✅ الرقم أولاً
            const action = args[1]; // ✅ الكلمة بعدها

            if (!num) {
                return api.sendMessage("❌ اكتب رقم صحيح.", threadID, messageID);
            }

            const target = handleReply.pending[num - 1];
            if (!target) {
                return api.sendMessage(
                    "❌ الرقم غير موجود.",
                    threadID,
                    messageID
                );
            }

            // ❌ رفض أو حظر
            if (action === "رفض" || action === "حظر") {

                await api.sendMessage(
                    `⚠️ تم ${action} طلبكم.`,
                    target.threadID
                );

                await api.removeUserFromGroup(
                    api.getCurrentUserID(),
                    target.threadID
                );

                api.sendMessage(
                    `❌ تم ${action}\n📌 المجموعة: ${target.name}`,
                    threadID
                );
            }

            // ✅ قبول
            else {
                await api.sendMessage(
                    "✅ تم تفعيل البوت بنجاح!\nاكتب (اوامر)",
                    target.threadID
                );

                api.sendMessage(
                    `✅ تم القبول\n📌 المجموعة: ${target.name}`,
                    threadID
                );
            }

            api.unsendMessage(handleReply.messageID);

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ حدث خطأ.", threadID);
        }
    },

    onStart: async ({ api, event, config }) => {
        const { threadID, senderID } = event;

        if (!config.adminUIDs.includes(senderID)) {
            return api.sendMessage("❌ هذا الأمر للمطور فقط.", threadID);
        }

        const list = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
        const pendingGroups = list.filter(t => t.isGroup);

        if (!pendingGroups.length) {
            return api.sendMessage("📭 لا توجد طلبات.", threadID);
        }

        let msg = "📋 طلبات التفعيل:\n\n";

        pendingGroups.forEach((t, i) => {
            msg += `${i + 1}. ${t.name || "مجموعة"}\n`;
        });

        msg += "\n📌 الاستخدام:\n";
        msg += "1 → قبول\n";
        msg += "1 رفض → رفض\n";
        msg += "1 حظر → حظر";

        api.sendMessage(msg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: "موافقة",
                messageID: info.messageID,
                author: senderID,
                pending: pendingGroups
            });
        });
    }
};

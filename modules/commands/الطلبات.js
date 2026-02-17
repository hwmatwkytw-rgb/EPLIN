module.exports = {
    config: {
        name: "الطلبات",
        version: "5.4",
        author: "wsky",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إدارة طلبات البوت (إصلاح كامل)",
        category: "المطور"
    },
    onReply: async ({ api, event, handleReply, config }) => {
        const { body, threadID, messageID, senderID } = event;
        if (!config.adminUIDs.includes(senderID)) return;

        try {
            const indexes = body.split(/\s+/);
            for (const i of indexes) {
                const num = parseInt(i.replace(/\D/g, ""));
                const isBan = body.includes("حظر");
                const isRefuse = body.includes("رفض");
                
                const target = handleReply.pending[num - 1];
                if (!target) continue;

                if (isBan || isRefuse) {
                    await api.sendMessage(`⚠️ تم ${isBan ? "حظر" : "رفض"} طلبكم.`, target.threadID);
                    await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
                } else {
                    await api.sendMessage(`✅ تم تفعيل البوت! اكتب (اوامر) للبدء.`, target.threadID);
                }
            }
            api.sendMessage("✅ تم تنفيذ العملية بنجاح.", threadID);
            api.unsendMessage(handleReply.messageID);
        } catch (e) {
            api.sendMessage("❌ خطأ في التنفيذ.", threadID);
        }
    },
    onStart: async ({ api, event, config }) => {
        if (!config.adminUIDs.includes(event.senderID)) return api.sendMessage("❌ للمطور فقط.", event.threadID);
        const list = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
        if (!list.length) return api.sendMessage("📭 لا توجد طلبات معلقة.", event.threadID);

        let msg = "📥 طلبات التفعيل:\n";
        list.forEach((t, i) => msg += `\n[${i + 1}] ${t.name || "مجموعة"}\n🆔 ${t.threadID}\n`);
        msg += "\nرد بالرقم للقبول، أو (رفض/حظر + الرقم)";

        api.sendMessage(msg, event.threadID, (err, info) => {
            global.client.handleReply.push({
                name: "الطلبات",
                messageID: info.messageID,
                author: event.senderID,
                pending: list
            });
        });
    }
};

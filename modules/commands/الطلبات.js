module.exports = {
    config: {
        name: "الطلبات",
        version: "6.5",
        author: "سينكو",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إدارة طلبات تفعيل البوت بزخرفة المسار الطولي.",
        category: "المطور"
    },

    onReply: async ({ api, event, handleReply }) => {
        const { body, threadID, messageID, senderID } = event;
        
        if (senderID !== handleReply.author) return;

        try {
            const args = body.split(/\s+/);
            const num = parseInt(args[0]);
            const isBan = body.includes("حظر");
            const isRefuse = body.includes("رفض");
            
            const target = handleReply.pending[num - 1];
            if (!target) {
                return api.sendMessage("●───── ⌬ ─────●\n┇ ❌ الرقم غير موجود في القائمة.\n●───── ⌬ ─────●", threadID, messageID);
            }

            if (isBan || isRefuse) {
                await api.sendMessage(`●───── ⌬ ─────●\n┇ ⚠️ تـم ${isBan ? "حـظـر" : "رفـض"} طـلـبكم.\n●───── ⌬ ─────●`, target.threadID);
                await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
                
                api.sendMessage(`●───── ⌬ ─────●\n┇ ⦿ ⟬ تـم الـرفـض ❌ ⟭\n┇\n┇ 𓋰 الـمجموعة: ${target.name}\n┇ 𓋰 الإجـراء: ${isBan ? "حـظر طـرد" : "رفـض"}\n●───── ⌬ ─────●`, threadID);
            } else {
                await api.sendMessage(`●───── ⌬ ─────●\n┇ ✅ تـم تـفعيل الـبوت بـنجاح!\n┇ 𓋰 اكتب (اوامر) للبدء.\n●───── ⌬ ─────●`, target.threadID);
                
                api.sendMessage(`●───── ⌬ ─────●\n┇ ⦿ ⟬ تـم الـتـفـعـيـل ✅ ⟭\n┇\n┇ 𓋰 الـمجموعة: ${target.name}\n┇ 𓋰 الـحالة: نـاجح\n●───── ⌬ ─────●`, threadID);
            }

            api.unsendMessage(handleReply.messageID);

        } catch (e) {
            console.error(e);
            api.sendMessage("❌ حدث خطأ أثناء التنفيذ.", threadID);
        }
    },

    onStart: async ({ api, event, config }) => {
        const { threadID, senderID } = event;

        if (!config.adminUIDs.includes(senderID)) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ ❌ هـذا الأمـر لـلـمـطـوࢪ فـقـط.\n●───── ⌬ ─────●", threadID);
        }

        const list = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
        const pendingGroups = list.filter(t => t.isGroup);

        if (!pendingGroups.length) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ 𓆩 📭 𓆪 لا تـوجـد طـلـبـات حـالـيـاً.\n●───── ⌬ ─────●", threadID);
        }

        let msg = `●───── ⌬ ─────●\n┇ ⦿ ⟬ طـلـبـات الـتـفـعـيـل ⟭\n┇\n`;

        pendingGroups.forEach((t, i) => {
            msg += `┇ ⟬ ${i + 1} ⟭ ❪ ${t.name || "مجموعة غير معروفة"} ❫\n`;
            msg += `┇ 🆔 𝖨𝖣: ${t.threadID}\n`;
            if (i < pendingGroups.length - 1) msg += `┇ ╼╼╼╼╼╼╼╼╼╼╼╼╼\n`;
        });

        msg += `┇\n●───── ⌬ ─────●\n`;
        msg += ` ⠇رد بـ الـرقم للـقـبـول\n`;
        msg += ` ⠇رد بـ (رفض + الرقم) لـلـطـرد\n`;
        msg += ` ⠇رد بـ (حظر + الرقم) لـلـحـظـر`;

        api.sendMessage(msg, threadID, (err, info) => {
            if (err) return console.error(err);
            global.client.handleReply.push({
                name: "الطلبات",
                messageID: info.messageID,
                author: senderID,
                pending: pendingGroups
            });
        });
    }
};

module.exports = {
    config: {
        name: "الطلبات",
        version: "6.0",
        author: "wsky & Abu Obaida",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إدارة طلبات تفعيل البوت الملكية",
        category: "المطور"
    },

    onReply: async ({ api, event, handleReply }) => {
        const { body, threadID, messageID, senderID } = event;
        
        // التحقق من أن الشخص الذي يرد هو المطور الذي طلب القائمة
        if (senderID !== handleReply.author) return;

        try {
            const args = body.split(/\s+/);
            const num = parseInt(args[0]); // استخراج الرقم الأول
            const isBan = body.includes("حظر");
            const isRefuse = body.includes("رفض");
            
            // التأكد من وجود الطلب في القائمة
            const target = handleReply.pending[num - 1];
            if (!target) {
                return api.sendMessage("ꕥ ┋ ❌ الرقم الذي اخترته غير موجود في القائمة.", threadID, messageID);
            }

            if (isBan || isRefuse) {
                // في حالة الرفض أو الحظر
                await api.sendMessage(`ꕥ ┋ ⚠️ تم ${isBan ? "حـظـر" : "رفـض"} طلب تفعيل المجموعة من قبل المطور.`, target.threadID);
                await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
                
                api.sendMessage(`╭───〔 𓆩 ❌ تـم الـرفـض 𓆪 〕───╮\n┃ ꕥ الـمجموعة: ${target.name}\n┃ ꕥ الـإجراء: ${isBan ? "حـظر طـرد" : "رفـض فقط"}\n╰──────────────────╯`, threadID);
            } else {
                // في حالة القبول
                await api.sendMessage(`ꕥ ┋ ✅ تـم تـفعيل الـبوت بـنجاح!\nꕥ ┋ اكـتب (اوامر) لـاستكشاف الـميزات.`, target.threadID);
                
                api.sendMessage(`╭───〔 𓆩 ✅ تـم الـتـفـعـيـل 𓆪 〕───╮\n┃ ꕥ الـمجموعة: ${target.name}\n┃ ꕥ الـحالة: نـاجح\n╰──────────────────╯`, threadID);
            }

            // حذف رسالة الطلبات القديمة لتنظيم الشات
            api.unsendMessage(handleReply.messageID);

        } catch (e) {
            console.error(e);
            api.sendMessage("ꕥ ┋ ❌ حـدث خطأ أثناء تنفيذ الإجراء.", threadID);
        }
    },

    onStart: async ({ api, event, config }) => {
        const { threadID, senderID } = event;

        if (!config.adminUIDs.includes(senderID)) {
            return api.sendMessage("ꕥ ┋ ❌ هـذا الأمر مخصص لعرش المطور فقط.", threadID);
        }

        // جلب قائمة الطلبات المعلقة (Pending)
        const list = await api.getThreadList(50, null, ["PENDING", "OTHER"]);
        const pendingGroups = list.filter(t => t.isGroup); // تصفية المجموعات فقط

        if (!pendingGroups.length) {
            return api.sendMessage("ꕥ ┋ 𓆩 📭 𓆪 لا توجد طلبات تفعيل حالياً.", threadID);
        }

        let msg = `ꕥ ─────────────── ꕥ\n`;
        msg += `  𓆩  𓆪  طـلـبات الـتـفـعـيـل  𓆩  𓆪\n`;
        msg += `ꕥ ─────────────── ꕥ\n\n`;

        pendingGroups.forEach((t, i) => {
            msg += `╭───〔 𓆩 ${i + 1} 𓆪 〕───╮\n`;
            msg += `┃ ꕥ الـاسم: ${t.name || "مجموعة غير معروفة"}\n`;
            msg += `┃ 🆔 الـآيدي: ${t.threadID}\n`;
            msg += `╰──────────────────╯\n\n`;
        });

        msg += `ꕥ ─────────────── ꕥ\n`;
        msg += `💡 رد بالـرقم لـلقبول\n`;
        msg += `💡 رد بـ (رفض + الرقم) لـلخروج\n`;
        msg += `💡 رد بـ (حظر + الرقم) لـلخروج الـنهائي`;

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

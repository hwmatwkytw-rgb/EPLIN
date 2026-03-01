const config = {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "1.0.0",
    credits: "Gemini ✨",
    description: "الحدث المسؤول عن تنفيذ حمايات المجموعة"
};

async function onCall({ message, event, data, api }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    // جلب الإعدادات التي قمنا بحفظها في الكود السابق
    const settings = data.thread.data?.antiSettings || {};
    const botID = api.getCurrentUserID();

    // إذا كان البوت هو من قام بالتغيير، نتجاهل الحدث لعدم الدخول في حلقة مفرغة
    if (author == botID) return;

    // 1. حماية الكنيات (antiChangeNickname)
    if (logMessageType === "log:user-nickname" && settings.antiChangeNickname) {
        const { participantID, nickname } = logMessageData;
        const oldNickname = data.thread.info.nicknames[participantID] || "";
        
        api.sendMessage(`🛡️ [حماية الكنيات] عذراً، ممنوع تغيير الكنية حالياً!`, threadID);
        return api.changeNickname(oldNickname, threadID, participantID);
    }

    // 2. حماية اسم المجموعة (antiChangeGroupName)
    if (logMessageType === "log:thread-name" && settings.antiChangeGroupName) {
        const oldName = data.thread.info.threadName;
        
        api.sendMessage(`🛡️ [حماية الاسم] تم استعادة اسم المجموعة الأصلي.`, threadID);
        return api.setTitle(oldName, threadID);
    }

    // 3. حماية صورة المجموعة (antiChangeGroupImage)
    if (logMessageType === "log:thread-icon" && settings.antiChangeGroupImage) {
        // ملاحظة: استعادة الصورة تتطلب تخزين رابط الصورة مسبقاً، هنا نقوم بالتنبيه فقط
        // أو يمكنك منع الشخص الذي غيرها إذا أردت
        api.sendMessage(`🛡️ [حماية الصورة] تم اكتشاف تغيير في صورة المجموعة!`, threadID);
    }

    // 4. منع الخروج (antiOut)
    if (logMessageType === "log:unsubscribe" && settings.antiOut) {
        if (logMessageData.leftParticipantFbId != botID) {
            api.addUserToGroup(logMessageData.leftParticipantFbId, threadID, (err) => {
                if (!err) api.sendMessage(`🛡️ [ممنوع الخروج] تم إعادة العضو رغماً عنه!`, threadID);
                else api.sendMessage(`🛡️ [ممنوع الخروج] فشلت الإعادة، قد يكون العضو حظر البوت.`, threadID);
            });
        }
    }
}

export default {
    config,
    onCall
};

const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "1.0.0",
    author: "Gemini",
    description: "مراقبة وتنفيذ حمايات المجموعة"
  },

  onStart: async ({ api, event }) => {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    // تجاهل الأكشن إذا كان الفاعل هو البوت نفسه
    if (author == botID) return;

    // جلب بيانات المجموعة من قاعدة البيانات
    const threadData = Threads.get(threadID) || {};
    const anti = threadData.settings?.anti || {};

    try {
      // 1. حماية اسم المجموعة
      if (logMessageType === "log:thread-name" && anti.antiName) {
        const oldName = threadData.threadName || "الاسم الأصلي";
        api.setTitle(oldName, threadID);
        return api.sendMessage(`🛡️ [ قـفـل الاسـم ]\nعذراً، حماية الاسم مفعلة. تم استعادة الاسم الأصلي.`, threadID);
      }

      // 2. منع الخروج (إعادة الإضافة فوراً)
      if (logMessageType === "log:unsubscribe" && anti.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID !== botID) {
          api.addUserToGroup(leftID, threadID, (err) => {
            if (!err) api.sendMessage(`🛡️ [ مـمـنـوع الـخـروج ]\nتم إعادة العضو بنجاح.`, threadID);
          });
        }
      }

      // 3. حماية الكنيات
      if (logMessageType === "log:user-nickname" && anti.antiNickname) {
        const { participantID } = logMessageData;
        const oldNicknames = threadData.nicknames || {};
        const oldNick = oldNicknames[participantID] || "";
        
        api.changeNickname(oldNick, threadID, participantID);
        return api.sendMessage(`🛡️ [ قـفـل الـكـنـيـة ]\nممنوع تغيير الألقاب حالياً.`, threadID);
      }

      // 4. حماية صورة المجموعة
      if (logMessageType === "log:thread-icon" && anti.antiIcon) {
         api.sendMessage(`🛡️ [ قـفـل الـصـورة ]\nتم اكتشاف تغيير في صورة المجموعة، يرجى مراجعة المسؤولين.`, threadID);
         // ملحوظة: استعادة الصورة برمجياً تتطلب رابط تخزين مسبق.
      }

    } catch (err) {
      console.error("خطأ في حدث الحماية:", err);
    }
  }
};

const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "1.1.0",
    author: "سينكو / Gemini",
    description: "نظام حماية المجموعات المتقدم (نمط هندسي)"
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, logMessageType, logMessageData, author } = event;
      const botID = api.getCurrentUserID();

      // تجاهل أي إجراء يقوم به البوت نفسه لتجنب التكرار (Loop)
      if (author == botID) return;

      // جلب بيانات المجموعة وإعدادات الحماية
      const threadData = Threads.get(threadID) || {};
      const settings = threadData.settings || {};
      const anti = settings.anti || {};

      // 1. [ حماية اسم المجموعة ]
      if (logMessageType === "log:thread-name" && anti.antiName) {
        const oldName = threadData.threadName || "الاسم الأصلي";
        await api.setTitle(oldName, threadID);
        return api.sendMessage(`🛡️ [  اسي مالك معا الاسم؟ ]\n◈ ─── ◈\n ،.\n.`, threadID);
      }

      // 2. [ منع الخروج ]
      if (logMessageType === "log:unsubscribe" && anti.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID !== botID) {
          api.addUserToGroup(leftID, threadID, (err) => {
            if (!err) api.sendMessage(`🛡️ [  مارق وين بكرامتك 🥹 ]\n◈ ─── ◈\n. `, threadID);
          });
        }
      }

      // 3. [ حماية الكنيات / الألقاب ] (الميزة الجديدة)
      if (logMessageType === "log:user-nickname" && anti.antiNickname) {
        const participantID = logMessageData.participantID;
        // جلب اللقب القديم المخزن في قاعدة البيانات أو تركه فارغاً إذا لم يوجد
        const oldNicknames = threadData.nicknames || {};
        const oldNick = oldNicknames[participantID] || "";
        
        await api.changeNickname(oldNick, threadID, participantID);
        return api.sendMessage(`🛡️ [  يمنع تغير الكنيات ]\n◈ ─── ◈\n.\n.`, threadID);
      }

      // 4. [ حماية صورة المجموعة ]
      if (logMessageType === "log:thread-icon" && anti.antiIcon) {
         api.sendMessage(`🛡️ [ قـفـل الـصـورة ]\n◈ ─── ◈\n⚠️ تم اكتشاف محاولة تغيير الصورة.\nالحماية مفعمة، يرجى مراجعة المسؤولين.`, threadID);
      }

    } catch (err) {
      console.error("خطأ في نظام الحماية:", err);
    }
  }
};

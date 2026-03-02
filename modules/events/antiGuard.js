const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "1.2.0",
    author: "سينكو / Gemini",
    description: "نظام حماية المجموعات (مختصر ومطور)"
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, logMessageType, logMessageData, author } = event;
      const botID = api.getCurrentUserID();

      if (author == botID) return;

      const threadData = (await Threads.get(threadID)) || {};
      const settings = threadData.settings || {};
      const anti = settings.anti || {};

      // 1. [ حماية الاسم ]
      if (logMessageType === "log:thread-name" && anti.antiName) {
        const oldName = threadData.threadName || "المجموعة";
        await api.setTitle(oldName, threadID);
        return api.sendMessage("🛡️ تم استعادة اسم المجموعة (الحماية مفعلة).", threadID);
      }

      // 2. [ منع الخروج ]
      if (logMessageType === "log:unsubscribe" && anti.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID !== botID) {
          api.addUserToGroup(leftID, threadID, (err) => {
            if (!err) api.sendMessage("🛡️ عذراً، الخروج ممنوع حالياً.", threadID);
          });
        }
      }

      // 3. [ حماية الكنيات ]
      if (logMessageType === "log:user-nickname" && anti.antiNickname) {
        const pID = logMessageData.participantID || logMessageData.participantId;
        const oldNicknames = threadData.nicknames || {};
        const oldNick = oldNicknames[pID] || "";
        
        await api.changeNickname(oldNick, threadID, pID);
        return api.sendMessage("🛡️ تم إلغاء تغيير اللقب (الحماية مفعلة).", threadID);
      }

      // 4. [ حماية الصورة ]
      if (logMessageType === "log:thread-icon" && anti.antiIcon) {
         return api.sendMessage("🛡️ تنبيه: تغيير صورة المجموعة ممنوع.", threadID);
      }

    } catch (err) {
      console.error("خطأ في AntiGuard:", err);
    }
  }
};

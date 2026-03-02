const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "1.5.0",
    author: "سينكو / Gemini",
    description: "حماية المجموعات"
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, logMessageType, logMessageData, author } = event;
      if (author == api.getCurrentUserID()) return;

      const threadData = (await Threads.get(threadID)) || {};
      const anti = (threadData.settings && threadData.settings.anti) ? threadData.settings.anti : {};

      // 1. حماية الاسم
      if (logMessageType === "log:thread-name" && anti.antiName) {
        await api.setTitle(threadData.threadName || "", threadID);
        return api.sendMessage("🛡️ الاسم مقفل.", threadID);
      }

      // 2. منع الخروج
      if (logMessageType === "log:unsubscribe" && anti.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID != api.getCurrentUserID()) {
          api.addUserToGroup(leftID, threadID);
          return api.sendMessage("🛡️ الخروج ممنوع.", threadID);
        }
      }

      // 3. حماية الألقاب (الكنية) - تم الإصلاح هنا
      if (logMessageType === "log:user-nickname" && anti.antiNickname) {
        const pID = logMessageData.participantID || logMessageData.participantId;
        const oldNick = (threadData.nicknames && threadData.nicknames[pID]) ? threadData.nicknames[pID] : "";
        
        await api.changeNickname(oldNick, threadID, pID);
        return api.sendMessage("🛡️ الألقاب مقفلة.", threadID);
      }

      // 4. حماية الصورة
      if (logMessageType === "log:thread-icon" && anti.antiIcon) {
         return api.sendMessage("🛡️ الصورة مقفلة.", threadID);
      }

    } catch (err) {
      console.error("AntiGuard Error:", err);
    }
  }
};

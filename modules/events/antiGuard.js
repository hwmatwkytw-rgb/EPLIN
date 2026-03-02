const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "2.0.0",
    author: "سينكو / Gemini",
    description: "حماية المجموعات المتقدمة"
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, logMessageType, logMessageData, author } = event;
      const botID = api.getCurrentUserID();
      if (author == botID) return;

      let threadData = (await Threads.get(threadID)) || {};
      const settings = threadData.settings || {};
      const anti = settings.anti || {};

      // --- [ 1. نظام حماية الألقاب المطور ] ---
      if (logMessageType === "log:user-nickname") {
        const pID = logMessageData.participantID || logMessageData.participantId;
        const newNickname = logMessageData.nickname; // اللقب الجديد الذي حاول الشخص وضعه

        if (anti.antiNickname) {
          // إذا الحماية مفعلة: استرجع القديم
          const oldNick = (threadData.nicknames && threadData.nicknames[pID]) ? threadData.nicknames[pID] : "";
          await api.changeNickname(oldNick, threadID, pID);
          return api.sendMessage("🛡️ الألقاب مقفلة.", threadID);
        } else {
          // إذا الحماية معطلة: احفظ اللقب الجديد كمرجع مستقبلي
          if (!threadData.nicknames) threadData.nicknames = {};
          threadData.nicknames[pID] = newNickname;
          await Threads.set(threadID, threadData);
        }
      }

      // --- [ 2. حماية الاسم ] ---
      if (logMessageType === "log:thread-name" && anti.antiName) {
        await api.setTitle(threadData.threadName || "", threadID);
        return api.sendMessage("🛡️ الاسم مقفل.", threadID);
      }

      // --- [ 3. منع الخروج ] ---
      if (logMessageType === "log:unsubscribe" && anti.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID != botID) {
          api.addUserToGroup(leftID, threadID);
          return api.sendMessage("🛡️ الخروج ممنوع.", threadID);
        }
      }

      // --- [ 4. حماية الصورة ] ---
      if (logMessageType === "log:thread-icon" && anti.antiIcon) {
         return api.sendMessage("🛡️ الصورة مقفلة.", threadID);
      }

    } catch (err) {
      console.error("AntiGuard Error:", err);
    }
  }
};

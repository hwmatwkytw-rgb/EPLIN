const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "antiGuard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
    version: "2.5.0",
    author: "سينكو / Gemini",
    description: "حماية المجموعات المتقدمة - نظام الألقاب"
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, logMessageType, logMessageData, author } = event;
      const botID = api.getCurrentUserID();
      
      // لا تفعل شيئاً إذا كان البوت هو من قام بالتغيير
      if (author == botID) return;

      let threadData = (await Threads.get(threadID)) || {};
      const settings = threadData.settings || {};
      const anti = settings.anti || {};

      // --- [ 1. نظام حماية الألقاب المطور ] ---
      if (logMessageType === "log:user-nickname") {
        const pID = logMessageData.participantID;
        const newNickname = logMessageData.nickname;

        if (anti.antiNickname === true) {
          // جلب الكنية القديمة من قاعدة البيانات
          const oldNick = (threadData.nicknames && threadData.nicknames[pID]) ? threadData.nicknames[pID] : "";
          
          // إرجاع الكنية القديمة
          await api.changeNickname(oldNick, threadID, pID);
          return api.sendMessage("الكنيات دي بتاريخك مالك معها 😼.", threadID);
        } else {
          // إذا الحماية معطلة، نقوم بتحديث الكنية في قاعدة البيانات لتكون هي المرجع
          if (!threadData.nicknames) threadData.nicknames = {};
          threadData.nicknames[pID] = newNickname;
          await Threads.set(threadID, threadData);
        }
      }

      // --- [ 2. حماية اسم المجموعة ] ---
      if (logMessageType === "log:thread-name" && anti.antiName === true) {
        const oldName = threadData.threadName || "المجموعة";
        await api.setTitle(oldName, threadID);
        return api.sendMessage("اسي مالك معا الاسم دا؟.", threadID);
      }

      // --- [ 3. منع الخروج (Anti-Out) ] ---
      if (logMessageType === "log:unsubscribe" && anti.antiOut === true) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID !== botID) {
          await api.addUserToGroup(leftID, threadID);
          return api.sendMessage("قال انا بخليك تخرج بكرامه 😼", threadID);
        }
      }

      // --- [ 4. حماية صورة المجموعة ] ---
      if (logMessageType === "log:thread-icon" && anti.antiIcon === true) {
         // ملاحظة: استرجاع الصورة يحتاج تخزين رابط الصورة مسبقاً، حالياً سنكتفي بالتنبيه
         return api.sendMessage("🛡️ تغيير صورة المجموعة ممنوع.", threadID);
      }

    } catch (err) {
      console.error("AntiGuard Error:", err);
    }
  }
};

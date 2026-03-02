const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "اعدادات",
    version: "1.5",
    author: "سينكو",
    countDown: 5,
    description: "ضبط حماية المجموعة",
    category: "group",
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID } = event;
      if (!event.isGroup) return api.sendMessage('❌ للمجموعات فقط.', threadID);

      let threadData = (await Threads.get(threadID)) || {};
      if (!threadData.settings) threadData.settings = {};
      if (!threadData.settings.anti) {
        threadData.settings.anti = { antiSpam: false, antiOut: false, antiName: false, antiIcon: false, antiNickname: false };
      }

      const anti = threadData.settings.anti;
      const keys = ["antiSpam", "antiOut", "antiName", "antiIcon", "antiNickname"];

      if (args[0] === 'تغيير') {
        const index = parseInt(args[1]) - 1;
        if (index >= 0 && index < keys.length) {
          const key = keys[index];
          anti[key] = !anti[key];

          // --- إضافة هامة: حفظ الألقاب الحالية عند تفعيل الحماية ---
          if (key === "antiNickname" && anti[key]) {
            const info = await api.getThreadInfo(threadID);
            threadData.nicknames = info.nicknames; 
          }

          await Threads.set(threadID, threadData);
          return api.sendMessage(`✅ تم ${anti[key] ? 'تفعيل' : 'تعطيل'} الخيار (${args[1]})`, threadID);
        }
        return api.sendMessage('❌ رقم غير صحيح.', threadID);
      }

      const status = (bool) => bool ? "🟢" : "🔴";
      let msg = `🛡️ ضبط الحماية\n━━━━━━\n`;
      msg += `1️⃣ سبام: ${status(anti.antiSpam)}\n2️⃣ خروج: ${status(anti.antiOut)}\n3️⃣ اسم: ${status(anti.antiName)}\n4️⃣ صورة: ${status(anti.antiIcon)}\n5️⃣ ألقاب: ${status(anti.antiNickname)}\n━━━━━━\n💡 تغيير: اعدادات تغيير <رقم>`;
      
      return api.sendMessage(msg, threadID, messageID);
    } catch (err) {
      api.sendMessage('❌ خطأ في الحفظ.', threadID);
    }
  }
};

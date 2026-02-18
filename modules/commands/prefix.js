const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix ',
    version: '1.2',
    author: 'جيميني',
    countDown: 5,
    prefix: false, 
    description: 'يعرض بادئة النظام وبادئة المجموعة بزخرفة ملكية الموديل 3',
    category: 'utility',
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID, isGroup } = event;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      // بادئة المجموعة الحالية
      const groupPrefix = threadData.settings.prefix || 'لا تـوجـد';

      // --- تغيير بادئة المجموعة ---
      if (args[0] === 'تغيير' || args[0] === 'setprefix') {
        if (!isGroup)
          return api.sendMessage("𑁍 ────────────── 𑁍\n❌ الأمر دا خاص بالمجموعات بس\n𑁍 ────────────── 𑁍", threadID, messageID);

        if (!args[1])
          return api.sendMessage("𑁍 ────────────── 𑁍\n⚠️ أرسل البادئة الجديدة بعد الكلمة\n𑁍 ────────────── 𑁍", threadID, messageID);

        threadData.settings.prefix = args[1];
        Threads.set(threadID, threadData);

        let successMsg = `𑁍 ────────────── 𑁍\n`;
        successMsg += `⊱ ✅ ⊰ **تـم الـتـحـديـث** ⊱ ✅ ⊰\n\n`;
        successMsg += `𖤍 ┋ الـحـالـة: تـم التـغـيـيـر\n`;
        successMsg += `𖦹 ┋ الـجـديـدة: 『 ${args[1]} 』\n`;
        successMsg += `𑁍 ────────────── 𑁍`;

        return api.sendMessage(successMsg, threadID, messageID);
      }

      // --- عرض البوادئ الحالية (الموديل 3) ---
      const systemPrefix = global.client.config.prefix || 'نظامي';

      let displayMsg = `𑁍 ────────────── 𑁍\n`;
      displayMsg += `⊱ ✨ ⊰ مـعـلومـات الـبـادئة ⊱ ✨ ⊰\n\n`;
      displayMsg += `𖤍 ┋ بـادئـة الـنـظـام: 『 ${systemPrefix} 』\n`;
      displayMsg += `𖦹 ┋ بـادئـة الـقـروب: 『 ${groupPrefix} 』\n`;
      displayMsg += ` ┋ الأمـر الـحـالـي: 『 البرفكس 』\n\n`;
      displayMsg += `𑁍 ────────────── 𑁍\n`;
      displayMsg += `🎖️ لـلتـغيير: البرفكس تغيير [الرمز]`;

      api.sendMessage(displayMsg, threadID, messageID);

    } catch (err) {
      console.error('خطأ في أمر prefix:', err);
      api.sendMessage('𑁍 ─ ❌ حصل خطأ في النظام ─ 𑁍', event.threadID);
    }
  }
};

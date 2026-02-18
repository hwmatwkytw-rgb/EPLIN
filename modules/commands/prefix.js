const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix ',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: false,
    description: 'عرض بادئة المجموعة والنظام بزخرفة هادئة',
    category: 'utility',
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID } = event;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      const groupPrefix = threadData.settings.prefix || 'لـم تـحدد';

      // --- تغيير البادئة ---
      if (args[0] === 'setprefix') {
        if (!event.isGroup) return api.sendMessage('❌ للمجموعات فقط', threadID);
        if (!args[1]) return api.sendMessage('⚠️ أرسل الرمز الجديد', threadID);

        threadData.settings.prefix = args[1];
        Threads.set(threadID, threadData);

        let successMsg = `𑁍 ──────────── 𑁍\n`;
        successMsg += `⊱ ✅ ⊰ **تـم الـتـحـديـث**\n\n`;
        successMsg += `𖤍 ┋ الـجـديـدة: 『 ${args[1]} 』\n`;
        successMsg += `𑁍 ──────────── 𑁍`;
        return api.sendMessage(successMsg, threadID);
      }

      // --- عرض المعلومات ---
      const systemPrefix = global.client.config.prefix || 'نظامي';

      let message = `𑁍 ──────────── 𑁍\n`;
      message += `⊱ ✨ ⊰ **مـعـلومـات الـبـادئة**\n\n`;
      message += `𖤍 ┋ الـنـظـام: 『 ${systemPrefix} 』\n`;
      message += `𖦹 ┋ الـقـروب: 『 ${groupPrefix} 』\n`;
      message += `𑁍 ──────────── 𑁍`;

      api.sendMessage(message, threadID, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حصل خطأ في تنفيذ الأمر', event.threadID);
    }
  }
};

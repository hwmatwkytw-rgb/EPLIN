const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'بادئة',
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'يضبط بادئة مخصصة للمجموعة الحالية أو يعمل بدون بادئة.',
    category: 'group',
    guide: {
      en: '   {pn} [البادئة_الجديدة] أو اتركها فارغة للعمل بدون بادئة'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID } = event;
      // لو لم يدخل المستخدم أي بادئة، سيتم العمل بدون بادئة
      let newPrefix = args[0] || '';

      const threadData = Threads.get(threadID);
      if (!threadData) {
        return api.sendMessage('𑁍 ────────────── 𑁍\n❌ تعذر العثور على بيانات المجموعة.\n𑁍 ────────────── 𑁍', threadID, messageID);
      }

      threadData.settings.prefix = newPrefix;
      Threads.set(threadID, threadData);

      let msg = `𑁍 ────────────── 𑁍\n`;
      msg += `⊱ ✅ ⊰ تـم تـم ⊱ ✅ ⊰\n\n`;

      if (newPrefix === '') {
        msg += `𖤍 ┋ الـحـالـة: تـم التـصـفـيـر\n`;
        msg += `𖦹 ┋ الـوصـف: الـعـمل بـدون بـادئـة\n`;
        msg += `🔱 ┋ الـنـتـيـجـة: 『 نـجـاح 』\n`;
      } else {
        msg += `𖤍 ┋ الـحـالـة: تـم الـضـبـط\n`;
        msg += `𖦹 ┋ الـبـادئـة: 『 ${newPrefix} 』\n`;
        msg += `🔱 ┋ الـنـتـيـجـة: 『 نـجـاح 』\n`;
      }

      msg += `\n𑁍 ────────────── 𑁍`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error("خطأ في أمر تعيين البادئة:", error);
      api.sendMessage('𑁍 ─ ❌ حـدث خـطأ فـي الـنظام ─ 𑁍', event.threadID);
    }
  },
};

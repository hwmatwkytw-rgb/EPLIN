const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: 'prefix', 
    version: '1.2',
    author: 'Edited by Abu Obaida',
    countDown: 5,
    prefix: false,
    description: 'عرض وتعديل بادئة المجموعة بنمط هندسي حاد',
    category: 'الخدمات',
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID } = event;
      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};

      const groupPrefix = threadData.settings.prefix || 'لـم تـحدد';
      const systemPrefix = global.client.config.prefix || '/';

      // --- تغيير البادئة (set) ---
      if (args[0] === 'set') {
        if (!event.isGroup) return api.sendMessage('❌ هذا الأمر متاح للمجموعات فقط.', threadID);
        if (!args[1]) return api.sendMessage('⚠️ يرجى إدخال الرمز الجديد (مثال: البرفكس set !)', threadID);

        threadData.settings.prefix = args[1];
        Threads.set(threadID, threadData);

        let successMsg = `◈ ─── تـحـديـث الـبـادئـة ─── ◈\n\n`;
        successMsg += `◉ تـم تـغيير بـادئـة الـمجموعة بـنجاح\n`;
        successMsg += `◉ الـرمز الـجديـد: ⬩ 『 ${args[1]} 』\n\n`;
        successMsg += `━━━━━━━━━━━━━━━━━\n`;
        successMsg += `│← الـحـالـة: تـم الـتـنـفـيـذ 𓋹`;
        
        return api.sendMessage(successMsg, threadID);
      }

      // --- عرض معلومات البادئة (نمط هندسي صلب) ---
      let message = `◈ ───  مـعـلومـات الـبـادئة  ─── ◈\n\n`;
      message += `✧ بـادئة الـنـظام العـامة ⠐\n`;
      message += `◉ 『 ${systemPrefix} 』\n`;
      message += `━━━━━━━━━━━━━━━━━\n\n`;
      
      message += `✧ بـادئة هـذه الـمـجـموعة ⠐\n`;
      message += `◉ 『 ${groupPrefix} 』\n`;
      message += `━━━━━━━━━━━━━━━━━\n\n`;

      message += `◈ ───────────────── ◈\n`;
      message += `│← لـلـتـغيير: البرفكس set <الرمز>\n`;
      message += `│← الـمـطـوࢪ: سينكو 𓋹`;

      api.sendMessage(message, threadID, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ داخلي أثناء معالجة الطلب.', event.threadID);
    }
  }
};

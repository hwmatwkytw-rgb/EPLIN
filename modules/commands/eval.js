const { log } = require('../../logger/logger');
const { inspect } = require('util');

module.exports = {
  config: {
    name: 'eval',
    version: '1.0',
    author: 'سينكو', // يمكنك تغييره لاسمك
    countDown: 0,
    prefix: true,
    adminOnly: true, // تفعيل خيار الإدمن فقط كطبقة حماية أولى
    aliases: ['eval', 'افلين', 'برمجة'],
    description: '💻 تنفيذ أكواد JavaScript برمجية (للمطور فقط)',
    category: 'owner',
    guide: {
      en: '{pn} [code]'
    },
  },

  onStart: async ({ message, args, event, api, Users, Threads, config }) => {
    // تحديد الآيدي الخاص بك للحماية القصوى
    const ownerID = "61588108307572"; 
    
    // التحقق من أن المرسل هو المطور صاحب الآيدي
    if (event.senderID !== ownerID) {
      return api.sendMessage(
        '🚫 | هذا الأمر مخصص لمطور البوت فقط.',
        event.threadID
      );
    }

    // التحقق من وجود كود للإدخال
    if (!args[0]) {
      return api.sendMessage(
        '⚠️ | يرجى إدخال الكود المراد تنفيذه.',
        event.threadID
      );
    }

    try {
      const code = args.join(" ");
      // تنفيذ الكود
      let evaled = await eval(code);

      // تحويل النتيجة لنص لتسهيل قراءتها
      if (typeof evaled !== "string") {
        evaled = inspect(evaled, { depth: 1 });
      }

      // إرسال النتيجة
      api.sendMessage(
        `✅ | النتيجة:\n\n\`\`\`js\n${evaled}\n\`\`\``,
        event.threadID
      );

      log('info', `Eval executed by owner: ${code}`);

    } catch (error) {
      log('error', `Eval Error: ${error.message}`);
      api.sendMessage(
        `❌ | حدث خطأ أثناء التنفيذ:\n\n\`\`\`text\n${error.message}\n\`\`\``,
        event.threadID
      );
    }
  },
};

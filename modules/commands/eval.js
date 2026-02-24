const { inspect } = require('util');
const { log } = require('../../logger/logger'); 

module.exports = {
  config: {
    name: 'eval',
    version: '2.5',
    author: 'سينكو',
    countDown: 0,
    prefix: true,
    adminOnly: true, // تأكيد إضافي من الإعدادات
    aliases: ['eval', 'افلين', 'برمجة', 'js'],
    description: 'تنفيذ واستكشاف أكواد جافا سكريبت مع الوصول الكامل للمتغيرات',
    category: 'owner',
    guide: {
      en: '{pn} [code]'
    },
  },

  onStart: async function(context) {
    const { message, args, event, api, Users, Threads, config, Currencies } = context;
    const ownerID = "61588108307572"; 
    
    // التحقق من صلاحية المطور
    if (event.senderID !== ownerID) {
      return api.sendMessage('🚫 هذا الأمر مخصص للمطور فقط.', event.threadID);
    }

    const code = args.join(" ");
    if (!code) {
      return api.sendMessage('⚠️ الرجاء كتابة الكود البرمجي المراد تنفيذه.', event.threadID);
    }

    // وظيفة داخلية لتنفيذ الكود في نطاق يحتوي على المتغيرات
    const execute = async (str) => {
        // فك المتغيرات لكي تصبح متاحة للـ eval
        const { api, event, Users, Threads, Currencies, args, config, message } = context;
        return eval(str);
    };

    try {
      let evaled = await execute(code);
      
      // تحويل النتيجة لنص منسق
      let output = typeof evaled === "string" ? evaled : inspect(evaled, { depth: 1 });

      // حماية بيانات الحساب (AppState)
      const appState = JSON.stringify(api.getAppState());
      if (output.includes(appState)) {
        output = output.replace(appState, "[PROTECTED - تم إخفاء بيانات تسجيل الدخول]");
      }

      // معالجة النتائج الطويلة جداً
      if (output.length > 2000) {
        const fs = require('fs');
        const path = __dirname + '/cache/eval_result.txt';
        if (!fs.existsSync(__dirname + '/cache')) fs.mkdirSync(__dirname + '/cache');
        
        fs.writeFileSync(path, output);
        return api.sendMessage({
          body: "✅ النتيجة كبيرة جداً، تم حفظها في ملف:",
          attachment: fs.createReadStream(path)
        }, event.threadID, () => { if(fs.existsSync(path)) fs.unlinkSync(path) });
      }

      api.sendMessage(
        `:\n\n${output}`,
        event.threadID
      );

      log('info', `Eval executed successfully by: ${event.senderID}`);

    } catch (error) {
      api.sendMessage(
        `❌ خطأ في التنفيذ:\n\n${error.message}`,
        event.threadID
      );
      log('error', `Eval Error: ${error.stack}`);
    }
  },
};

const { inspect } = require('util');
const { log } = require('../../logger/logger'); 

module.exports = {
  config: {
    name: 'eval',
    version: '2.0',
    author: 'سينكو',
    countDown: 0,
    prefix: true,
    adminOnly: true,
    aliases: ['eval', 'افلين', 'برمجة'],
    description: 'تنفيذ واستكشاف أكواد جافا سكريبت',
    category: 'owner',
    guide: {
      en: '{pn} [code]'
    },
  },

  onStart: async ({ message, args, event, api, Users, Threads, config, Currencies }) => {
    const ownerID = "61588108307572"; 
    
    if (event.senderID !== ownerID) {
      return api.sendMessage('هذا الأمر مخصص للمطور فقط.', event.threadID);
    }

    const code = args.join(" ");
    if (!code) {
      return api.sendMessage('الرجاء كتابة الكود البرمجي.', event.threadID);
    }

    try {
      let evaled = await eval(code);
      let output = inspect(evaled, { depth: 1 });

      // حماية بيانات الحساب
      const appState = JSON.stringify(api.getAppState());
      if (output.includes(appState)) {
        output = output.replace(appState, "[PROTECTED]");
      }

      // إذا كانت النتيجة أطول من حد الرسالة (2000 حرف)
      if (output.length > 2000) {
        const fs = require('fs');
        const path = __dirname + '/cache/result.txt';
        if (!fs.existsSync(__dirname + '/cache')) fs.mkdirSync(__dirname + '/cache');
        
        fs.writeFileSync(path, output);
        return api.sendMessage({
          body: "النتيجة تتجاوز الحد المسموح، تم حفظها في ملف:",
          attachment: fs.createReadStream(path)
        }, event.threadID, () => { if(fs.existsSync(path)) fs.unlinkSync(path) });
      }

      api.sendMessage(
        `النتيجة:\n\n${output}`,
        event.threadID
      );

      log('info', `Eval executed by: ${event.senderID}`);

    } catch (error) {
      api.sendMessage(
        `خطأ:\n\n${error.message}`,
        event.threadID
      );
      log('error', `Eval Error: ${error.stack}`);
    }
  },
};

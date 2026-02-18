const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'ملف',
    version: '1.2',
    author: ' & Abu Obaida',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'جلب محتوى ملف برمجياً بزخرفة ملكية',
    category: 'admin',
    guide: {
      ar: '{pn} [اسم_الأمر]'
    },
  },

  onStart: async ({ args, event, api }) => {
    const { threadID, messageID } = event;

    try {
      // إذا لم يكتب اسم الملف، يعرض له قائمة الملفات المتاحة في سطر واحد
      if (args.length < 1) {
        const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
        const fileNames = files.map(f => f.replace('.js', ''));
        
        // تحويل المصفوفة لسطر واحد مفصول بنقاط فخمة
        const singleLineList = fileNames.join(' • ');

        let listMsg = `╭━━━━〔 𓆩 📂 𓆪 〕━━━━╮\n┃\n`;
        listMsg += `┃ 𓆩 ꕥ 𓆪 قـائـمـة الـمـلـفات الـمـتـاحـة:\n┃\n`;
        listMsg += `┃ 〖 ${singleLineList} 〗\n┃\n`;
        listMsg += `╰━━━━━━━━━━━━━━━━━━━━╯\n`;
        listMsg += `💡 اكـتب [ ملف + اسم الملف ] لـلعرض`;
        
        return api.sendMessage(listMsg, threadID, messageID);
      }

      const commandName = args[0].toLowerCase();
      const commandPath = path.join(__dirname, `${commandName}.js`);

      if (fs.existsSync(commandPath)) {
        const fileContent = fs.readFileSync(commandPath, 'utf8');
        
        // إرسال كود الملف داخل بلوك برمجي
        const fileMsg = 
          `╭───〔 𓆩 📄 مـحـتـوى الـمـلـف 𓆪 〕───╮\n` +
          `┃ ꕥ الـاسم: ${commandName}.js\n` +
          `╰──────────────────╯\n\n` +
          `code:\n${fileContent}`;

        return api.sendMessage(fileMsg, threadID, messageID);
      } else {
        return api.sendMessage(`ꕥ ┋ ❌ لـم يـتم الـعثور على الـأمر [ ${commandName} ]`, threadID, messageID);
      }
    } catch (error) {
      console.error(error);
      api.sendMessage('ꕥ ┋ ❌ حـدث خـطأ أثـناء جـلب الـملف.', threadID, messageID);
    }
  },
};

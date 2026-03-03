const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "كمند",
    version: "1.0.0",
    author: "Kenji",
    countDown: 5,
    role: 2,
    description: "تحديث وتحميل الأوامر برمجياً بزخرفة جديدة",
    category: "owner",
    guide: { ar: "{pn} لود | {pn} تحميل [اسم_الأمر]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const commandPath = path.join(process.cwd(), 'modules', 'commands');

    const loadCmd = (filename) => {
      try {
        const filePath = path.resolve(commandPath, `${filename}.js`);
        if (!fs.existsSync(filePath)) throw new Error(`الملف غير موجود`);

        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.config || !command.config.name) throw new Error("تنسيق غير صحيح");

        global.client.commands.set(command.config.name, command);
        return { status: "success", name: filename };
      } catch (err) {
        return { status: "failed", name: filename, error: err.message };
      }
    };

    if (!args[0]) {
      return api.sendMessage("⚠️ استخدم: كمند لود (تحديث الكل) أو كمند تحميل [الاسم]", threadID, messageID);
    }

    if (args[0] === "تحميل") {
      if (!args[1]) return api.sendMessage("❌ يرجى كتابة اسم الأمر.", threadID, messageID);
      
      const res = loadCmd(args[1]);
      let msg = `●─────── ⌬ ───────●\n`;
      msg += `┇ ⦿ ⟬ جـاري الـمـعـالـجـة ⟭\n┇\n`;
      msg += `┇ الـوصـف: تحديث أمر منفرد\n`;
      msg += `┇ الأمـر: ${args[1]}.js\n`;
      
      if (res.status === "success") {
        msg += `┇ الـحـالـة: تـم التـحـمـيل بـنجـاح ✅\n`;
      } else {
        msg += `┇ الـحـالـة: فـشـل الـتـحـمـيل ❌\n`;
        msg += `┇ الـسـبب: ${res.error}\n`;
      }
      msg += `●─────── ⌬ ───────●`;
      
      return api.sendMessage(msg, threadID, messageID);
    } 
    
    else if (args[0] === "لود") {
      const files = fs.readdirSync(commandPath).filter(f => f.endsWith('.js'));
      let success = 0, fail = 0;

      for (const file of files) {
        const name = file.split('.')[0];
        const res = loadCmd(name);
        if (res.status === "success") success++;
        else fail++;
      }

      let msg = `●─────── ⌬ ───────●\n`;
      msg += `┇ ⦿ ⟬ تـحـديـث الـنـظـام ⟭\n┇\n`;
      msg += `┇\n`;
      msg += `┇ نـجـاح: ${success} ✅\n`;
      msg += `┇ فـشـل: ${fail} ❌\n`;
      msg += `┇ \n`;
      msg += `●─────── ⌬ ───────●`;

      api.sendMessage(msg, threadID, messageID);
    }
  }
};

const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "كمند",
    version: "1.0.0",
    author: "Kenji",
    countDown: 5,
    role: 2,
    description: "تحديث وتحميل الأوامر برمجياً",
    category: "owner",
    guide: { ar: "{pn} لود | {pn} تحميل [اسم_الأمر]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const commandPath = path.join(process.cwd(), 'modules', 'commands');

    const loadCmd = (filename) => {
      try {
        const filePath = path.join(commandPath, `${filename}.js`);
        if (!fs.existsSync(filePath)) throw new Error(`الملف ${filename}.js غير موجود`);

        // مسح الكاش لإعادة التحميل الفعلي
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.config || !command.config.name) throw new Error("تنسيق الأمر غير صحيح");

        global.client.commands.set(command.config.name, command);
        return { status: "success", name: filename };
      } catch (err) {
        return { status: "failed", name: filename, error: err.message };
      }
    };

    if (!args[0]) return api.sendMessage("⚠️ استخدم: كمند لود (لتحديث الكل) أو كمند تحميل [الاسم]", threadID, messageID);

    if (args[0] === "تحميل") {
      if (!args[1]) return api.sendMessage("❌ يرجى كتابة اسم الأمر.", threadID, messageID);
      const res = loadCmd(args[1]);
      if (res.status === "success") {
        api.sendMessage(`✅ تم تحديث الأمر "${res.name}.js" بنجاح.`, threadID, messageID);
      } else {
        api.sendMessage(`❌ فشل تحميل "${res.name}": ${res.error}`, threadID, messageID);
      }
    } 
    else if (args[0] === "لود") {
      const files = fs.readdirSync(commandPath).filter(f => f.endsWith('.js'));
      let success = 0, fail = 0, errors = "";

      for (const file of files) {
        const name = file.split('.')[0];
        const res = loadCmd(name);
        if (res.status === "success") success++;
        else {
          fail++;
          errors += `\n- ${name}: ${res.error}`;
        }
      }

      api.sendMessage(`🔄 تم تحديث النظام:\n✅ نجاح: ${success}\n❌ فشل: ${fail}${fail > 0 ? `\n\nالأخطاء:${errors}` : ""}`, threadID, messageID);
    }
  }
};

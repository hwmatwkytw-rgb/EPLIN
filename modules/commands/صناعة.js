const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "صناعة",
    version: "1.1.0",
    author: "محمد (SINKO)",
    countDown: 5,
    role: 0, // بنتحكم في الصلاحية جوه الكود بالـ ID
    category: "المطور",
    description: "توليد هيكل الأوامر الجديد بسرعة فخمة (خاص بسينكو)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // 🔐 قفل الأمان: ابلين ما بتشتغل إلا لـ "محمد" (صاحب الـ ID 72)
    const adminID = "61588108307572"; // حطيت الـ ID بتاعك كامل هنا

    if (senderID !== adminID) {
      return api.sendMessage("✨ أوه، عذراً يا فنان.. الأوامر دي حصرية لـ 'محمد' (SINKO) فقط. رقيّي ما بيسمح لي أخدم غيره في الحتات التقيلة دي! ✨💅", threadID, messageID);
    }

    if (args.length < 2) {
      return api.sendMessage("✨ يا فنان، الطريقة كدة: \n/صناعة [اسم_الأمر] [الوصف] ✨", threadID, messageID);
    }

    const cmdName = args[0];
    const cmdDesc = args.slice(1).join(" ");

    const template = `
module.exports = {
  config: {
    name: "${cmdName}",
    version: "1.0.0",
    author: "محمد (SINKO)",
    countDown: 5,
    role: 0,
    category: "owner",
    description: "${cmdDesc}"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    try {
      // ابدأ إبداعك هنا يا فنان ✨
      return api.sendMessage("تم تشغيل أمر ${cmdName} بنجاح! 💅", threadID, messageID);
    } catch (e) {
      return api.sendMessage("أوه، حصل خطأ: " + e.message, threadID, messageID);
    }
  }
};`;

    try {
      const cachePath = path.join(__dirname, "cache");
      await fs.ensureDir(cachePath);
      const filePath = path.join(cachePath, `${cmdName}.js`);
      
      await fs.writeFile(filePath, template.trim());

      await api.sendMessage({
        body: `✨ تم تجهيز 'السيستم' الجديد: (${cmdName}) ✨\n\nتفضل الملف يا محمد، ارفعه وابدأ البل الراقي! 💅💎`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (err) {
      return api.sendMessage("✨ أحييي، حصلت مشكلة تقنية في عالمي الراقي! ✨", threadID, messageID);
    }
  }
};

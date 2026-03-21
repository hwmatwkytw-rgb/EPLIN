const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// المسار الحقيقي بعد كشف ترجمة المتصفح
const apiKenji = require("../../func/api_aplin.js");

module.exports = {
  config: {
    name: "رسم",
    version: "1.0.0",
    author: "SINKO",
    countDown: 5,
    role: 0,
    category: "AI"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) return api.sendMessage("أدخل وصف الصورة يا ملك 🎨", threadID, messageID);

    api.setMessageReaction("🎨", messageID, () => {}, true);

    try {
      // تشغيل وظيفة fastMj من ملف api_aplin.js
      const result = await apiKenji.fastMj(prompt);
      const imgUrl = result.images[0];
      
      // مسار مؤقت للصورة في مجلد الأوامر
      const cachePath = path.join(__dirname, "cache", `aplin_${Date.now()}.jpg`);
      await fs.ensureDir(path.dirname(cachePath));

      const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(cachePath, Buffer.from(res.data));

      return api.sendMessage({
        body: `تـم الـرسـم بـنـجـاح ✅\nالـوصـف: ${prompt}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("الـ API مـشـغـول حالياً، جرب مرة أخرى.", threadID, messageID);
    }
  }
};

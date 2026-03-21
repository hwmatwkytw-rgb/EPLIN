const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
// استدعاء الـ API من مجلد "دالة" (المسار الصحيح لبوتك)
const apiKenji = require("../دالة/api_kenji.js");

module.exports = {
  config: {
    name: "رسم",
    version: "1.0.0",
    author: "SINKO",
    countDown: 5,
    role: 0,
    category: "الذكاء الاصطناعي"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) return api.sendMessage("أدخل وصف الصورة يا ملك 🎨", threadID, messageID);

    // تفاعل الانتظار
    api.setMessageReaction("🎨", messageID, () => {}, true);

    try {
      // تشغيل وظيفة fastMj من الـ API "المسروق"
      const result = await apiKenji.fastMj(prompt);
      const imgUrl = result.images[0];
      
      const cachePath = path.join(__dirname, "cache", `kenji_${Date.now()}.jpg`);
      
      // تحميل الصورة مؤقتاً لإرسالها
      const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(cachePath, Buffer.from(res.data));

      return api.sendMessage({
        body: `تم الرسم بنجاح ✅\nالطلب: ${prompt}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("الـ API حالياً مشغول أو التوكن خلص، جرب لاحقاً.", threadID, messageID);
    }
  }
};

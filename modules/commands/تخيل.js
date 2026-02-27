const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "تخيل",
    version: "2.2.1-fixed",
    author: "@RI F AT",
    countDown: 5,
    role: 0, // 2 = فقط للمطور أو مستوى خاص
    category: "ai",
    guide: {
      en: "Reply to an image with: {pn} <prompt>"
    }
  },

  onStart: async function({ api, event, args, message }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply(
        "❌ Please provide a prompt!\nExample: usd a beautiful sunset"
      );
    }

    let imageUrl;

    // التحقق إذا كانت الرسالة رد على صورة
    if (event.type === "message_reply") {
      const attachment = event.messageReply.attachments[0];
      if (attachment && (attachment.type === "photo" || attachment.type === "image")) {
        imageUrl = attachment.url;
      }
    }

    if (!imageUrl) {
      return message.reply("❌ Please reply to an image!");
    }

    // مسار تخزين مؤقت للملف
    const cacheDir = path.join(__dirname, "cache");
    const cachePath = path.join(cacheDir, `img_${Date.now()}.png`);

    try {
      // تفاعل البوت مع الرسالة أثناء التحميل
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // التأكد من وجود مجلد cache
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      // طلب إنشاء الصورة من API
      const apiUrl = `https://uncensored-sd.onrender.com/api/sd?prompt=${encodeURIComponent(
        prompt
      )}&imageUrl=${encodeURIComponent(imageUrl)}`;

      const response = await axios({
        method: "get",
        url: apiUrl,
        responseType: "stream",
        timeout: 120000
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // إرسال الصورة مع النص
      await message.reply({
        body: `🎨 Generated image with prompt:\n${prompt}`,
        attachment: fs.createReadStream(cachePath)
      });

      // حذف الصورة بعد الإرسال
      fs.unlinkSync(cachePath);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("USD Error:", error.message);

      // حذف الملف إذا حصل خطأ
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(`❌ Error generating image:\n${error.message}`);
    }
  }
};

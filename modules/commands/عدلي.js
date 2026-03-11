const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd'],
    version: '1.0.0',
    author: 'SINKO',
    countDown: 0,
    prefix: true,
    category: 'المالك'
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) return api.sendMessage('● اكتب وصفاً للصورة ●', threadID, messageID);

    try {
      // الرابط المباشر والأسرع
      const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}&model=flux`;
      
      const cachePath = path.join(__dirname, "cache", `img_${Date.now()}.png`);
      
      // تأكد من وجود مجلد الكاش
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
          fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
      }

      const response = await axios({ url, responseType: 'arraybuffer' });
      fs.writeFileSync(cachePath, Buffer.from(response.data, 'binary'));

      return api.sendMessage({
        body: "✨ تم التوليد بنجاح يا مبرمج ✨",
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (e) {
      return api.sendMessage("❌ في مشكلة في راندر، جرب بعد شوية.", threadID, messageID);
    }
  }
};

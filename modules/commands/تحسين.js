const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "تحسين", 
    version: "1.0",
    author: "Gemini AI",
    countDown: 15,
    category: "تعديل الصور",
    guide: { ar: "رد على صورة بكلمة {pn} لجعلها واضحة" }
  },

  onStart: async ({ api, event }) => {
    if (event.type !== "message_reply" || !event.messageReply.attachments[0]) {
      return api.sendMessage("⚠️ ارجوك رد على الصورة اللي تبي تحسن جودتها.", event.threadID);
    }

    const imageUrl = event.messageReply.attachments[0].url;
    // المفتاح الذي استخرجته أنت
    const API_KEY = "77bce5a1-e5e3-4133-9d00-7374b2a0d4f9"; 

    api.sendMessage("⏳ جاري تحسين جودة الصورة.. انتظر ثواني", event.threadID);

    try {
      const path = __dirname + `/cache/enhanced_image.jpg`;
      
      const response = await axios.post("https://api.deepai.org/api/waifu2x", {
        image: imageUrl
      }, {
        headers: {
          "api-key": API_KEY
        }
      });

      const finalImageUrl = response.data.output_url;
      const imageBuffer = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
      
      fs.writeFileSync(path, Buffer.from(imageBuffer.data));

      return api.sendMessage({
        body: "✅ تم تحسين جودة الصورة بنجاح!",
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path));

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ فشل المحرك. تأكد أن المفتاح صحيح أو أن الموقع يدعم هذه الخدمة حالياً.", event.threadID);
    }
  }
};

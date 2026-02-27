const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data"); // تأكد من تثبيت هذه المكتبة

module.exports = {
  config: {
    name: "تحسين", 
    version: "1.1",
    author: "Gemini AI",
    countDown: 15,
    category: "تعديل الصور",
    guide: { ar: "رد على صورة بكلمة {pn} لجعلها واضحة" }
  },

  onStart: async ({ api, event }) => {
    // التأكد من أن المستخدم رد على صورة
    if (event.type !== "message_reply" || !event.messageReply.attachments[0] || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("⚠️ ارجوك رد على الصورة التي تريد تحسين جودتها.", event.threadID, event.messageID);
    }

    const imageUrl = event.messageReply.attachments[0].url;
    const API_KEY = "77bce5a1-e5e3-4133-9d00-7374b2a0d4f9"; 

    api.sendMessage("⏳ جاري تحسين جودة الصورة.. انتظر ثواني", event.threadID);

    try {
      const path = __dirname + `/cache/enhanced_${Date.now()}.jpg`;
      
      // إعداد البيانات بصيغة FormData
      const form = new FormData();
      form.append("image", imageUrl);

      const response = await axios.post("https://api.deepai.org/api/waifu2x", form, {
        headers: {
          ...form.getHeaders(),
          "api-key": API_KEY
        }
      });

      const finalImageUrl = response.data.output_url;
      
      // تحميل الصورة الناتجة
      const imageBuffer = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(path, Buffer.from(imageBuffer.data));

      return api.sendMessage({
        body: "✅ تم تحسين جودة الصورة بنجاح!",
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (e) {
      console.error(e);
      let errorMsg = "❌ فشل المحرك. ";
      if (e.response && e.response.status === 401) errorMsg += "المفتاح (API Key) غير صالح.";
      else if (e.response && e.response.status === 402) errorMsg += "انتهى رصيد المفتاح المجاني.";
      else errorMsg += "تأكد من اتصالك بالإنترنت أو جرب لاحقاً.";
      
      return api.sendMessage(errorMsg, event.threadID, event.messageID);
    }
  }
};

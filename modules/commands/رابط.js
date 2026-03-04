const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "رابط",
    version: "1.0",
    author: "Gemini AI",
    role: 0, // متاح للجميع (أو 2 للمطور فقط حسب رغبتك)
    countDown: 5,
    category: "ai",
    guide: "{pn} [قم بالرد على صورة أو إرفاق صورة]"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, type, messageReply } = event;

    // ضع مفتاح الـ API الخاص بك هنا
    const API_KEY = "3963d5cc3ee64b07508b20f76a9e8bbd";

    // تحديد رابط الصورة (سواء مبعوتة مع الأمر أو رادد عليها)
    let imageUrl;
    if (type === "message_reply" && messageReply.attachments[0]?.url) {
      imageUrl = messageReply.attachments[0].url;
    } else if (event.attachments[0]?.url) {
      imageUrl = event.attachments[0].url;
    }

    if (!imageUrl) {
      return api.sendMessage("⚠️ يرجى الرد على صورة أو إرفاق صورة لرفعها.", threadID, messageID);
    }

    api.sendMessage("⏳ جاري رفع الصورة إلى ImgBB...", threadID, async (err, info) => {
      try {
        // تحضير البيانات لإرسالها لـ ImgBB
        const form = new FormData();
        form.append("image", imageUrl);

        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${API_KEY}`, form, {
          headers: form.getHeaders(),
        });

        if (response.data && response.data.status === 200) {
          const directLink = response.data.data.url;
          const deleteLink = response.data.data.delete_url;

          return api.sendMessage(
            `✅ تم الرفع بنجاح!\n\n🔗 الرابط المباشر:\n${directLink}\n\n🗑️ رابط الحذف:\n${deleteLink}`,
            threadID,
            messageID
          );
        } else {
          throw new Error("فشل الرفع، استجابة غير متوقعة.");
        }
      } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ حدث خطأ أثناء الرفع:\n${error.message}`, threadID, messageID);
      }
    }, messageID);
  }
};

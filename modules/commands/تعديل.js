const axios = require('axios');

module.exports = {
  config: {
    name: "تعديل", // تأكد من عدم وجود مسافات هنا
    version: "1.0",
    author: "سينكو",
    countDown: 5,
    prefix: true,
    category: "AI",
    description: "إعادة رسم الصور"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageReply, messageID } = event;

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length == 0) {
      return api.sendMessage("──❃ ┇ رد على صورة لكي أعيد رسمها يا بطل", threadID, messageID);
    }

    const prompt = args.join(" ") || "masterpiece, high quality";
    const imgUrl = messageReply.attachments[0].url;

    api.sendMessage("──❃ ┇ جاري المعالجة... انتظر قليلاً", threadID, messageID);

    try {
      // جربت لك هذا الرابط لأنه أسرع في الاستجابة للبوتات
      const res = await axios.get(`https://api.paxsenix.biz.id/ai/img2img?url=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(prompt)}`, {
        responseType: 'stream'
      });

      return api.sendMessage({
        body: "─── ❈ ⸻⸻ ❈ ⸻⸻ ❈ ───\n     ✨ تـم الـرسـم بـنـجـاح\n─── ❈ ⸻⸻ ❈ ⸻⸻ ❈ ───",
        attachment: res.data
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("──❃ ┇ حدث خطأ في النظام أو الـ API متوقف حالياً", threadID, messageID);
    }
  }
};

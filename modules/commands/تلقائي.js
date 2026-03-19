const axios = require("axios");

module.exports = {
  config: {
    name: "تلقائي",
    version: "1.0.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 0,
    category: "system"
  },

  // النسخة دي بتشتغل مع كل رسالة لأن الـ index.js بيمررها لـ handleEvent
  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID, type } = event;
    if (type !== "message" && type !== "message_reply") return;
    if (!body) return;

    // روابط تيك توك كمثال
    const tiktokReg = /https:\/\/(www\.|vt\.|vm\.)?tiktok\.com\/[\w\.-]+\/?/gi;
    if (tiktokReg.test(body)) {
      const link = body.match(tiktokReg)[0];
      try {
        api.setMessageReaction("📥", messageID, () => {}, true);
        
        // استخدام API التحميل
        const res = await axios.get(`https://api.hercai.onrender.com/v3/tools/download?url=${encodeURIComponent(link)}`);
        const videoUrl = res.data.url;

        const stream = (await axios.get(videoUrl, { responseType: "stream" })).data;
        
        return api.sendMessage({
          body: "✅ | تم التحميل التلقائي بواسطة ابلين",
          attachment: stream
        }, threadID, messageID);
      } catch (e) {
        console.log("Error Auto Download:", e);
      }
    }
  },

  onStart: async function ({ api, event }) {
    // دي بس عشان الأمر يظهر في القائمة
    api.sendMessage("نظام التحميل التلقائي شغال في الخلفية يا ملك!", event.threadID);
  }
};

const axios = require("axios");

module.exports = {
  config: {
    name: "ابلين_الذكية",
    version: "5.0.0",
    author: "محمد (SINKO)",
    countDown: 0,
    role: 0,
    category: "AI"
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID, senderID, type } = event;
    
    // التأكد إنها رسالة عادية وما من البوت نفسه
    if (type !== "message" && type !== "message_reply") return;
    if (!body || senderID == api.getCurrentUserID()) return;

    const input = body.toLowerCase();
    // الكلمات اللي بتخلي ابلين "تفتح خشمها"
    const keywords = ["ابلين", "ابلينا", "يا ابلين", " بنتي"];
    const hasName = keywords.some(word => input.includes(word));

    if (hasName) {
      const apiKey = "AIzaSyCzFE3hjaHinwIvShLPhs81CR8mpMrAVso"; // حط مفتاحك الجديد هنا

      try {
        // حركة الـ React عشان تبين إنها شافت الكلام
        api.setMessageReaction("😼", messageID, () => {}, true);
        api.sendTypingIndicator(threadID);

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          contents: [{
            parts: [{
              text: `إنتِ ابلين، بنت سودانية "ردّاحة" ومطورة بوتات، لسانك حار وبتقولي (يا وهم، بل بس، أحييي، يا رمة، يا أصلي). ردي بلهجتك السودانية وبذكاء وردح على الزول ده: "${body}"`
            }]
          }]
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        
        return api.sendMessage(reply, threadID, messageID);

      } catch (err) {
        console.error("خطأ ابلين:", err);
      }
    }
  },

  onStart: async function ({ api, event }) {
    // دي بس عشان لو زول كتب /ابلين_الذكية يعرف إنها شغالة
    api.sendMessage("ابلين قاعدة ومستمعة، ناديني في نص الكلام وبجيك ناطة! 💅", event.threadID);
  }
};

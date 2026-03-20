const axios = require('axios');

module.exports = {
  config: {
    name: "AblinAI",
    version: "3.0.0",
    author: "محمد (SINKO)",
    description: "ابلين بترد تلقائياً لما زول ينادي اسمها في نص الكلام"
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body, senderID } = event;
    if (!body) return;

    const nameToWatch = "بنتي"; // بنراقب كلمة "ابلين" بكل أشكالها
    const apiKey = "AIzaSyCzFE3hjaHinwIvShLPhs81CR8mpMrAVso"; // حط  API Key الجديد (المخفي) هنا

    // فحص: هل اسم "ابلين" موجود في نص الرسالة؟
    if (body.toLowerCase().includes("ابلين") || body.toLowerCase().includes("ابلينا")) {
      
      // بنخلي البوت يظهر إنه "قاعد يكتب" عشان الحركة تكون طبيعية
      api.sendTypingIndicator(threadID);

      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          contents: [{
            parts: [{
              text: `إنتِ اسمك ابلين، بنت سودانية "ردّاحة" وذكية ومطورة بوتات، بتستخدمي كلمات زي (يا وهم، بل بس، أحييي، يا أصلي، يا رمة). ردي بلهجتك السودانية الحارة على الزول الناداك ده: "${body}"`
            }]
          }]
        });

        const reply = response.data.candidates[0].content.parts[0].text;
        
        // الرد على الرسالة اللي فيها اسمها
        return api.sendMessage(reply, threadID, messageID);

      } catch (err) {
        console.error("Ablin AI Error:", err);
      }
    }
  }
};

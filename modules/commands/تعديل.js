const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "تعديل",
    aliases: ["edit"],
    version: "3.0",
    author: "AYOUB",
    description: "تعديل احترافي باستخدام API رسمي",
    countDown: 15,
    prefix: true,
    category: "ai"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // ⚠️ ضع مفتاحك هنا ليعمل الكود للأبد
    const EDEN_AI_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTBjYzM2NmMtNmVjOC00MDQyLTg1ZTUtZjQwMzFmZTZmMmZhIiwidHlwZSI6ImFwaV90b2tlbiJ9.ke9DNkk_iV7WuuIBwpGI_9FaQRJ__6ZrXwXQrCKn7FM"; 

    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ⚠️ يجب الرد على صورة لتعديلها\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("💡 اكتب الوصف بعد الأمر", threadID, messageID);

    api.setMessageReaction("⌛", messageID, () => {}, true);

    const waitingMsg = await api.sendMessage(
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ جـاري الـتـعديـل ✨
  •——◤ 🛠️ الـمـحرك : Eden AI ◥——•
──────────────────
  •——◤ ⏳ الـحالة : معالجة رسمية ◥——•
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`, threadID);

    try {
      const imageUrl = event.messageReply.attachments[0].url;

      // إرسال الطلب لـ API الرسمي
      const response = await axios.post('https://api.edenai.run/v2/image/generation', {
        providers: "openai", // أو "replicate"
        text: prompt,
        resolution: "512x512",
        fallback_providers: ""
      }, {
        headers: { Authorization: `Bearer ${EDEN_AI_KEY}` }
      });

      const resultUrl = response.data.openai.items[0].image_resource_url;
      const path = __dirname + `/cache/final_${Date.now()}.png`;
      
      const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(path, Buffer.from(imgRes.data));

      api.unsendMessage(waitingMsg.messageID);

      return api.sendMessage({
        body: 
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ تـم الـتـعديـل بـنـجـاح ✨
  •——◤ 🖼️ الـحالة : نـجـاح ◥——•
──────────────────
  •——◤ 👤 الـطلب : ${prompt} ◥——•
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (error) {
      console.error(error);
      api.editMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ❌ خطأ: تأكد من مفتاح الـ API\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", waitingMsg.messageID);
    }
  }
};

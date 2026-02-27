const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "تعديل",
    aliases: ["edit"],
    version: "3.1",
    author: "AYOUB",
    description: "تعديل احترافي باستخدام API رسمي",
    countDown: 15,
    prefix: true,
    category: "ai"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // تأكد أن المفتاح يبدأ بكلمة Bearer في الهيدر تلقائياً
    const EDEN_AI_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZjA5NTY5M2EtODA5Zi00YjFjLWE5M2EtYWVkYTA3YmVjZDNjIiwidHlwZSI6ImFwaV90b2tlbiJ9.JrOW2coSBACDWmEWSSymfFAAIIe1C0WSbnxfpuH5P_o"; 

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
  •——◤ ⏳ الـحالة : معالجة  ◥——•
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`, threadID);

    try {
      // إرسال الطلب باستخدام مزود خدمة Replicate (أكثر استقراراً للمجاني)
      const response = await axios.post('https://api.edenai.run/v2/image/generation', {
        providers: "replicate", 
        text: prompt,
        resolution: "512x512"
      }, {
        headers: { Authorization: `Bearer ${EDEN_AI_KEY}` }
      });

      // استخراج الرابط الصحيح بناءً على المزود المختار
      const resultUrl = response.data.replicate.items[0].image_resource_url;
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
      console.error(error.response ? error.response.data : error);
      api.editMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ❌ خطأ: الحساب المجاني انتهى أو المزود غير متاح\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", waitingMsg.messageID);
    }
  }
};

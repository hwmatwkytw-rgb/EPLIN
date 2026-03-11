const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '5.2.0',
    author: 'SINKO', // المطور: سينكو
    twitter: 'https://twitter.com/Sinko_Dev', // الرابط الوهمي الذي طلبته
    description: 'توليد صور بجودة عالية عبر Hugging Face XL',
    countDown: 5,
    prefix: true,
    category: 'owner',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572";
    // تم وضع مفتاحك الخاص هنا
    const HF_TOKEN = "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"; 

    if (senderID !== developerID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage('●─────── ❌ يرجى كتابة وصف للصورة ───────●', threadID, messageID);
    }

    api.setMessageReaction("⚙️", messageID, (err) => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري معالجة الطلب عبر سيرفرات Hugging Face... ►', threadID, messageID);

    try {
      const response = await axios({
        method: 'post',
        url: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        headers: { 
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        data: { 
          inputs: prompt,
          options: { wait_for_model: true } // هذا الخيار يجعل السيرفر ينتظر حتى يجهز النموذج بدلاً من إعطاء خطأ
        },
        responseType: 'arraybuffer'
      });

      const cachePath = path.join(__dirname, "cache", `hf_sinko_${Date.now()}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"));
      }
      
      await fs.writeFile(cachePath, response.data);

      const messageBody = 
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ نـتـيـجـة الـتـولـيـد ✨

  •——◤ 📝 الـوصـف : ${prompt} ◥——•
──────────────────
  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

      await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        api.unsendMessage(waitingMsg.messageID);
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      console.error('HF Error:', error.message);
      let errorMsg = '●─────── ❌ السيرفر مشغول حالياً، حاول مجدداً ───────●';
      
      if (error.response && error.response.status === 401) {
        errorMsg = '●─────── ❌ مفتاح الـ API غير صالح ───────●';
      }

      api.editMessage(errorMsg, waitingMsg.messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

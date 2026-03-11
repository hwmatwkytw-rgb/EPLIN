const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '5.6.0',
    author: 'SINKO',
    twitter: 'https://twitter.com/Sinko_Dev',
    description: 'توليد صور مستقر وسريع عبر Hugging Face',
    countDown: 5,
    prefix: true,
    category: 'owner',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572";
    const HF_TOKEN = "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"; 

    if (senderID !== developerID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage('●─────── ❌ اكتب وصفاً للصورة ───────●', threadID, messageID);

    api.setMessageReaction("⚙️", messageID, (err) => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري الاتصال بالسيرفر السريع... ►', threadID, messageID);

    try {
      const response = await axios({
        method: 'post',
        url: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        headers: { 
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        data: { 
          inputs: prompt,
          options: { wait_for_model: true, use_cache: false }
        },
        responseType: 'arraybuffer',
        timeout: 90000 // زيادة وقت الانتظار قليلاً لضمان الاستجابة
      });

      const cachePath = path.join(__dirname, "cache", `hf_fast_${Date.now()}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      await fs.writeFile(cachePath, response.data);

      await api.sendMessage({
        body: `╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n      ✨ نـتـيـجـة الـتـولـيـد ✨\n──────────────────\n  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        fs.unlinkSync(cachePath);
        api.unsendMessage(waitingMsg.messageID);
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      console.error(error.message);
      // إذا كان الخطأ أن الموديل ما زال يحمل، نطلب من المستخدم الانتظار قليلاً
      if (error.response && error.response.status === 503) {
          api.editMessage('●─────── ⏳ السيرفر يستعد، انتظر 30 ثانية وجرب مرة أخرى ───────●', waitingMsg.messageID);
      } else {
          api.editMessage('●─────── ❌ عذراً، حاول مرة أخرى الآن ───────●', waitingMsg.messageID);
      }
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

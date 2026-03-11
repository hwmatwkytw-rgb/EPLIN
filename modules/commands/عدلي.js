const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '5.5.0',
    author: 'SINKO',
    twitter: 'https://twitter.com/Sinko_Dev',
    description: 'توليد صور احترافية عبر Hugging Face مع محاولة إعادة الاتصال',
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
    const waitingMsg = await api.sendMessage('◄ جاري إيقاظ السيرفر ومعالجة الصورة (قد يستغرق دقيقة)... ►', threadID, messageID);

    // دالة لجلب الصورة مع محاولة التكرار في حال كان السيرفر نائماً
    async function fetchImage(retries = 3) {
      try {
        const response = await axios({
          method: 'post',
          url: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", // موديل أسرع وأكثر استقراراً
          headers: { "Authorization": `Bearer ${HF_TOKEN}` },
          data: { inputs: prompt },
          responseType: 'arraybuffer',
          timeout: 60000
        });
        return response.data;
      } catch (error) {
        if (retries > 0 && error.response && error.response.data.toString().includes('loading')) {
          await new Promise(res => setTimeout(res, 20000)); // انتظر 20 ثانية وأعد المحاولة
          return fetchImage(retries - 1);
        }
        throw error;
      }
    }

    try {
      const imageData = await fetchImage();
      const cachePath = path.join(__dirname, "cache", `hf_${Date.now()}.png`);
      
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      await fs.writeFile(cachePath, imageData);

      await api.sendMessage({
        body: `╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n      ✨ نـتـيـجـة الـتـولـيـد ✨\n──────────────────\n  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        fs.unlinkSync(cachePath);
        api.unsendMessage(waitingMsg.messageID);
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      api.editMessage('●─────── ❌ السيرفر لا يستجيب حالياً، جرب بعد لحظات ───────●', waitingMsg.messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

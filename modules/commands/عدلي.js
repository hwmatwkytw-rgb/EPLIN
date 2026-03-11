const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '5.8.0',
    author: 'SINKO',
    twitter: 'https://twitter.com/Sinko_Dev',
    description: 'توليد صور احترافي عبر HF على سيرفر راندر',
    countDown: 5,
    prefix: true,
    category: 'owner',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const HF_TOKEN = "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"; // مفتاحك اللي شغال

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage('●─────── ❌ اكتب وصفاً للصورة ───────●', threadID, messageID);

    api.setMessageReaction("⚙️", messageID, (err) => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري الاتصال بسيرفرات التوليد... ►', threadID, messageID);

    try {
      const response = await axios({
        method: 'post',
        url: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        headers: { "Authorization": `Bearer ${HF_TOKEN}` },
        data: { 
          inputs: prompt,
          options: { wait_for_model: true } // مهمة جداً لراندر
        },
        responseType: 'arraybuffer'
      });

      const cachePath = path.join(__dirname, "cache", `hf_res_${Date.now()}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));
      await fs.writeFile(cachePath, response.data);

      await api.sendMessage({
        body: `╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n      ✨ نـتـيـجـة الـتـولـيـد ✨\n──────────────────\n  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        fs.unlinkSync(cachePath);
        api.unsendMessage(waitingMsg.messageID);
      }, messageID);

    } catch (error) {
      api.editMessage('●─────── ❌ السيرفر مشغول، حاول مرة أخرى بعد قليل ───────●', waitingMsg.messageID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدل',
    aliases: ['sd', 'dream'],
    version: '3.0.0',
    author: 'AbuUbaida',
    description: 'توليد صور آمنة (للمطور فقط)',
    countDown: 5,
    prefix: true,
    category: 'ai',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572"; 

    if (senderID !== developerID) {
      return api.setMessageReaction("🚯", messageID, () => {}, true);
    }

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage('⚠️ | يرجى كتابة وصف يا ملك!', threadID, messageID);

    api.setMessageReaction("⚙️", messageID, () => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري معالجة وتوليد الصورة... ►', threadID, messageID);

    try {
      // استخدام API آمن وسريع (Hercai)
      const res = await axios.get(`https://api.hercai.onrender.com/v3/text2img?prompt=${encodeURIComponent(prompt)}`);
      const imageUrl = res.data.url;

      const cachePath = path.join(__dirname, "cache", `sd_${Date.now()}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      const imageRes = await axios({ url: imageUrl, responseType: 'stream' });
      const writer = fs.createWriteStream(cachePath);
      imageRes.data.pipe(writer);

      writer.on('finish', async () => {
        const messageBody = `╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n      ✨ نـتـيـجـة الـتـولـيـد ✨\n\n  •——◤ 📝 الـوصـف : ${prompt} ◥——•\n──────────────────\n  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

        await api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          fs.unlinkSync(cachePath);
          api.unsendMessage(waitingMsg.messageID);
        }, messageID);

        api.setMessageReaction("✅", messageID, () => {}, true);
      });

    } catch (error) {
      api.sendMessage('❌ | فشل التوليد، السيرفر محمي أو مضغوط.', threadID, messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  },
};

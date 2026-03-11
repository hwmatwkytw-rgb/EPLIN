const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '3.0.0',
    author: 'SINKO', // تم التحديث بناءً على تطويرك
    description: 'توليد وتعديل صور باستخدام Segmind API',
    countDown: 10,
    prefix: true,
    category: 'owner',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572";
    const apiKey = "SG_51040ca21a9312a1"; // مفتاحك الخاص

    if (senderID !== developerID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage('●─────── ❌ يرجى كتابة وصف ───────●', threadID, messageID);
    }

    if (event.type !== "message_reply" || !event.messageReply.attachments[0]) {
      return api.sendMessage('●─────── ❌ يرجى الرد على صورة لتعديلها ───────●', threadID, messageID);
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo" && attachment.type !== "image") {
      return api.sendMessage('●─────── ❌ الرد يجب أن يكون على صورة ───────●', threadID, messageID);
    }

    api.setMessageReaction("⚙️", messageID, (err) => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري معالجة وتوليد الصورة عبر Segmind... ►', threadID, messageID);

    const cachePath = path.join(__dirname, "cache", `segmind_${Date.now()}.png`);

    try {
      const data = {
        "prompt": prompt,
        "image": attachment.url,
        "samples": 1,
        "scheduler": "UniPC",
        "num_inference_steps": 25,
        "guidance_scale": 7.5,
        "strength": 0.75, // قوة التعديل على الصورة الأصلية
        "seed": Math.floor(Math.random() * 1000000)
      };

      const response = await axios.post("https://api.segmind.com/v1/sd1.5-img2img", data, {
        headers: { "x-api-key": apiKey },
        responseType: 'arraybuffer'
      });

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
      console.error('Segmind Error:', error.response ? error.response.data.toString() : error.message);
      api.editMessage('●─────── ❌ فشل في الاتصال بـ Segmind أو نفاد الرصيد ───────●', waitingMsg.messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  },
};

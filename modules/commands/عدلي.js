const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '2.2.1',
    author: 'RI F AT',
    description: 'توليد صور باستخدام الذكاء الاصطناعي بناءً على صورة ومطالبة',
    countDown: 5,
    prefix: true,
    category: 'ai',
    adminOnly: false
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    // التفاعل الأولي بالرموز
    api.setMessageReaction("⚙️", messageID, (err) => {}, true);

    // رسالة الانتظار بنفس نمط الكود الأول
    const waitingMsg = await api.sendMessage(
      '◄ جاري معالجة وتوليد الصورة... ►',
      threadID,
      messageID
    );
    const processingID = waitingMsg.messageID;

    // التحقق من المدخلات
    if (!prompt) {
      return api.editMessage('●─────── ❌ يرجى كتابة وصف ───────●', processingID);
    }

    let imageUrl;
    if (event.type === "message_reply") {
      const attachment = event.messageReply.attachments[0];
      if (attachment && (attachment.type === "photo" || attachment.type === "image")) {
        imageUrl = attachment.url;
      }
    }

    if (!imageUrl) {
      return api.editMessage('●─────── ❌ يرجى الرد على صورة ───────●', processingID);
    }

    const cachePath = path.join(__dirname, "cache", `sd_${Date.now()}.png`);

    try {
      const apiUrl = `https://uncensored-sd.onrender.com/api/sd?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;

      const response = await axios({
        method: 'get',
        url: apiUrl,
        responseType: 'stream',
        timeout: 120000
      });

      // التأكد من وجود مجلد التخزين المؤقت
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"));
      }

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // التصميم النهائي بنفس زخرفة الكود الأول
      const messageBody = 
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ نـتـيـجـة الـتـولـيـد ✨

  •——◤ 📝 الـوصـف : ${prompt} ◥——•
──────────────────
  •——◤ ✅ تـم الـتـنـفـيذ بـنـجـاح ◥——•
      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

      // إرسال الصورة مع النص المزخرف وحذف رسالة الانتظار
      await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        fs.unlinkSync(cachePath);
        api.unsendMessage(processingID);
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      console.error('SD Error:', error);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.editMessage('●─────── ❌ فشل في توليد الصورة ───────●', processingID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  },
};

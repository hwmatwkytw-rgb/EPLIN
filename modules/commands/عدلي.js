const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "عدلي",
    version: "2.2.1-fixed",
    author: "ابو عبيده علي", // تم التعديل ليناسب بصمتك
    countDown: 5,
    role: 1, // تم ضبطه كمسؤول (أدمن)
    description: "تعديل الصور بالذكاء الاصطناعي عبر الرد على الصورة",
    category: "ai",
    guide: { ar: "رد على الصورة واكتب سيدريم + الوصف" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageReply, senderID, messageID } = event;
    const prompt = args.join(" ");
    const developerID = "61586897962846"; // الآيدي الخاص بك

    // 1. التحقق من الصلاحيات (نفس منطق الكود الأول)
    try {
      const info = await api.getThreadInfo(threadID);
      const isAdmin = info.adminIDs.some(item => item.id == senderID);

      if (!isAdmin && senderID !== developerID)
        return api.sendMessage("انغلع يا فلاح، الخاصية دي للأدمن بس.", threadID, messageID);

      // 2. التحقق من المدخلات (الرد والوصف)
      if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0)
        return api.sendMessage(" رد على صور  .", threadID, messageID);

      if (!prompt)
        return api.sendMessage("اكتب وصف داير تعمل شنو في الصورة؟.", threadID, messageID);

      const attachment = messageReply.attachments[0];
      if (attachment.type !== "photo")
        return api.sendMessage("قلت ليك صورة، دي ما صورة 🌚.", threadID, messageID);

      const imageUrl = attachment.url;
      const cacheDir = path.join(__dirname, "cache");
      const cachePath = path.join(cacheDir, `img_${Date.now()}.png`);

      // تأكد من وجود مجلد الكاش
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      api.setMessageReaction("⏳", messageID, () => {}, true);

      // 3. الاتصال بـ API
      const apiUrl = `https://uncensored-sd.onrender.com/api/sd?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;

      const response = await axios({
        method: 'get',
        url: apiUrl,
        responseType: 'stream',
        timeout: 120000 
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // 4. الإرسال والرد
      await api.sendMessage({
        body: `تم يا زعيم 🎨\nالوصف: ${prompt}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        // حذف الملف بعد الإرسال بنجاح
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (err) {
      console.log(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("الذكاء الاصطناعي معلق ولا شنو؟ جرب بعد شوية 🦧.", threadID, messageID);
    }
  }
};

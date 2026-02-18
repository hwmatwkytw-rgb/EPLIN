const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: "خروفي",
    version: "1.0",
    author: "ابو عبيده علي",
    countDown: 3,
    prefix: true,
    adminOnly: false,
    category: "متعة",
    description: "رد على صورة شخص ليظهره على خروفك",
    guide: {
      en: "{pn} [رد أو منشن]"
    },
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID, senderID, messageReply, mentions } = event;
    const cacheDir = path.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      // تحديد الشخص المستهدف
      let targetID;
      if (messageReply) {
        targetID = messageReply.senderID;
      } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
      } else {
        return api.sendMessage("❌ رد على حد أو منشنه عشان يركب خروفك", threadID, messageID);
      }

      // روابط الصور
      const userAvatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const targetAvatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const backgroundUrl = "https://i.ibb.co/YThmPKSR/h2-Qh6-Jd-Wqf.jpg";

      // تحميل الصور باستخدام Canvas
      const [bgImg, userImg, targetImg] = await Promise.all([
        loadImage(backgroundUrl),
        loadImage(userAvatarUrl),
        loadImage(targetAvatarUrl)
      ]);

      const canvas = createCanvas(bgImg.width, bgImg.height);
      const ctx = canvas.getContext('2d');

      // رسم الخلفية
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // دالة لرسم الصورة بشكل دائري
      const drawCircleImg = (img, x, y, width, height) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, width, height);
        ctx.restore();
      };

      // وضع الصور في الإحداثيات المطلوبة
      drawCircleImg(userImg, 150, 200, 190, 190);
      drawCircleImg(targetImg, 170, 430, 190, 190);

      const filePath = path.join(cacheDir, `sheep_${Date.now()}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filePath, buffer);

      // إرسال النتيجة
      return api.sendMessage({
        body: "هاك خروفك جاهز! 🐑",
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ حصل خطأ في المكتبات أو الرابط، تأكد من تثبيت canvas.", threadID, messageID);
    }
  }
};

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: 'عدلي',
    version: '6.0',
    author: 'محمد - ابلين الذكي',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تعديل الصور بالذكاء الاصطناعي (نسخة فعالة)',
    guide: { ar: '{pn} <وصف التعديل>' },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, messageReply } = event;
    const description = args.join(' ').trim();

    // 1. التحقق من الرد على صورة
    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
      return api.sendMessage('⚠️ يا زول، لازم ترد على صورة عشان أقدر أعدلها ليك!', threadID, messageID);
    }

    if (!description) {
      return api.sendMessage('⚠️ أكتب وصف التعديل بعد الأمر (مثلاً: حولها لرسم كرتوني).', threadID, messageID);
    }

    const processingMsg = await api.sendMessage('🎨 جاري سحر الصورة... ثواني بس يا ملك.', threadID);

    try {
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const inputUrl = encodeURIComponent(messageReply.attachments[0].url);
      const finalPath = path.join(cacheDir, `edited_${Date.now()}.png`);

      // 2. استخدام API فعال لمعالجة الصور (Image Manipulation API)
      // ملاحظة: هذا الرابط يستخدم تقنية Image-to-Image
      const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?image_url=${inputUrl}&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(finalPath, Buffer.from(response.data));

      // 3. إرسال النتيجة
      await api.sendMessage({
        body: `✨ أبشر.. تم التعديل بنجاح!\n📝 الوصف: ${description}`,
        attachment: fs.createReadStream(finalPath)
      }, threadID, () => {
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      }, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage(`❌ معليش، حصل مشكلة في السيرفر: ${err.message}`, threadID, messageID);
    } finally {
      api.unsendMessage(processingMsg.messageID).catch(() => {});
    }
  }
};

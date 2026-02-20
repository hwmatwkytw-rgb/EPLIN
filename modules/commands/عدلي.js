const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  config: {
    name: 'عدلي',
    version: '5.0',
    author: 'AbuUbaida - Hum API Edition',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تعديل الصور بالذكاء الاصطناعي باستخدام Hum API - نسخة سريعة وبسيطة',
    guide: { ar: '{pn} <وصف التعديل>' },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, messageReply } = event;
    const description = args.join(' ').trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
      return api.sendMessage('⚠️ لازم ترد على صورة.', threadID, messageID);
    }

    if (!description) {
      return api.sendMessage('⚠️ اكتب وصف التعديل بعد الأمر.', threadID, messageID);
    }

    const processingMsg = await api.sendMessage('🎨 جاري تعديل الصورة... انتظر قليلاً.', threadID);

    try {
      // تجهيز مجلد مؤقت
      const cacheDir = path.resolve(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const tempPath = path.join(cacheDir, `input_${uuidv4()}.jpg`);
      const finalPath = path.join(cacheDir, `output_${uuidv4()}.jpg`);

      // تحميل الصورة المرفقة
      const imgBuffer = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, imgBuffer.data);

      // إرسال الصورة + وصف التعديل للـ Hum API
      const response = await axios.post(
        'https://pastebin-api.vercel.app/raw/YqSChU', // ضع هنا رابط API الفعلي
        {
          description: description,
          image: fs.createReadStream(tempPath)
        },
        { responseType: 'arraybuffer' }
      );

      // حفظ النتيجة محلياً
      fs.writeFileSync(finalPath, response.data);

      // إرسال الصورة المعدلة في المحادثة
      await api.sendMessage({
        body: `✨ تم التعديل بنجاح!\n📝 التعديل: ${description}`,
        attachment: fs.createReadStream(finalPath)
      }, threadID);

      // حذف الملفات المؤقتة
      [tempPath, finalPath].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });

    } catch (err) {
      console.error(err);
      await api.editMessage(`❌ فشل التعديل:\n${err.message}`, processingMsg.messageID);
    } finally {
      if (processingMsg?.messageID) api.deleteMessage(processingMsg.messageID).catch(() => {});
    }
  }
};

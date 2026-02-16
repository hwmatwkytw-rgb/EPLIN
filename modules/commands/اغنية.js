const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "اغنية",
    version: "1.2",
    author: "Hridoy (Edited)",
    countDown: 10,
    prefix: true,
    category: "media",
    description: "تحميل أغنية من Spotify وإرسالها كملف صوتي",
    guide: { ar: "{pn} اسم_الأغنية" }
  },

  onStart: async ({ event, api, args }) => {
    const { threadID, messageID } = event;
    const musicName = args.join(" ");

    if (!musicName) {
      return api.sendMessage('🎵 اكتب اسم الأغنية يا زول.', threadID, messageID);
    }

    const searchMsg = await api.sendMessage('⏳ جاري البحث والتحميل، ثواني بس...', threadID);
    const apiUrl = `https://hridoy-apis.vercel.app/play/spotify-v2?q=${encodeURIComponent(musicName)}&apikey=hridoyXQC`;
    const cachePath = path.join(__dirname, 'cache', `music_${Date.now()}.mp3`);

    try {
      // التأكد من وجود مجلد الكاش
      await fs.ensureDir(path.join(__dirname, 'cache'));

      // 1. طلب البيانات من الـ API
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 });
      
      // 2. التحقق من حجم البيانات المستلمة
      if (response.data.byteLength < 10000) { // أقل من 10 كيلوبايت يعني غالباً خطأ
        throw new Error('الملف المستلم غير صالح أو صغير جداً');
      }

      // 3. كتابة الملف مؤقتاً
      await fs.writeFile(cachePath, Buffer.from(response.data));

      // 4. إرسال الملف للمستخدم
      await api.sendMessage({
        body: `🎧 تم تحميل: ${musicName}\n✅ استمتع بالاستماع!`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        // حذف الملف بعد الإرسال لتوفير مساحة
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

      // حذف رسالة "جاري التحميل"
      api.unsendMessage(searchMsg.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ فشل تحميل الأغنية. تأكد من الاسم أو حاول لاحقاً.\nالسبب: ${error.message}`, threadID, messageID);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
  }
};

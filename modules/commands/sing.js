const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'sing ',
    version: '1.1',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    description: 'البحث وتشغيل الأغاني من يوتيوب، يختار الأكثر مشاهدة تلقائيًا.',
    category: 'music',
    guide: {
      ar: '{pn}اغنية <اسم الأغنية>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const query = args.join(' ').trim();

    if (!query) {
      return api.sendMessage('❌ الرجاء إدخال اسم الأغنية. مثال: اغنية Starboy', threadID, messageID);
    }

    let statusMsg;
    try {
      // رسالة جاري البحث
      statusMsg = await new Promise((resolve, reject) => {
        api.sendMessage('🔎 جاري البحث عن الأغنية...', threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        }, messageID);
      });

      // البحث في API
      const searchRes = await axios.get(`https://hridoy-apis.vercel.app/search/youtube?query=${encodeURIComponent(query)}&count=5&apikey=hridoyXQC`);
      const results = searchRes.data?.result;
      if (!Array.isArray(results) || results.length === 0) {
        await api.editMessage('❌ لم يتم العثور على أي أغاني.', statusMsg.messageID);
        return;
      }

      // اختيار الأكثر مشاهدة
      let mostViewed = results.reduce((prev, curr) => (curr.views > prev.views ? curr : prev), results[0]);

      await api.editMessage('⬇️ جاري التحميل...', statusMsg.messageID);

      // طلب رابط التحميل (يفضل yt-mp3 endpoint)
      const ytmp3Res = await axios.get(`https://hridoy-apis.vercel.app/downloader/ytmp3?url=${encodeURIComponent(mostViewed.url)}&apikey=hridoyXQC`);
      const downloadUrl = ytmp3Res.data?.result?.download;
      const musicTitle = ytmp3Res.data?.result?.title || mostViewed.title;
      const musicAuthor = mostViewed.author;
      const views = mostViewed.views?.toLocaleString?.() || mostViewed.views || "N/A";

      if (!downloadUrl) {
        await api.editMessage('❌ فشل الحصول على رابط تحميل الأغنية.', statusMsg.messageID);
        return;
      }

      await api.editMessage('📤 جاري الإرسال...', statusMsg.messageID);

      // إنشاء مجلد مؤقت
      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `اغنية_${Date.now()}.mp3`);

      // تحميل الأغنية
      const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000 });
      await fs.writeFile(filePath, Buffer.from(audioRes.data));

      // إرسال الأغنية
      await new Promise((resolve, reject) => {
        api.sendMessage({
          body: `🎶 ${musicTitle}\n👤 المؤلف: ${musicAuthor}\n👁️ المشاهدات: ${views}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, (err) => {
          fs.unlink(filePath).catch(() => {});
          if (err) reject(err);
          else resolve();
        }, messageID);
      });

      if (statusMsg?.messageID) {
        await api.unsendMessage(statusMsg.messageID);
      }

    } catch (error) {
      console.error('[اغنية] خطأ:', error);
      if (statusMsg?.messageID) {
        await api.editMessage('❌ حدث خطأ أثناء معالجة طلبك.', statusMsg.messageID);
        setTimeout(() => api.unsendMessage(statusMsg.messageID), 10000);
      } else {
        api.sendMessage('❌ حدث خطأ أثناء معالجة طلبك.', threadID, messageID);
      }
    }
  }
};

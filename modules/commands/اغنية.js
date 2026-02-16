const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "اغنية",
    version: "1.5",
    author: "Gemini AI",
    countDown: 5,
    prefix: true,
    category: "media",
    description: "تحميل الأغاني والكلمات عبر سيرفرات سريعة",
    guide: { ar: "{pn} اسم_الأغنية" }
  },

  onStart: async ({ event, api, args }) => {
    const { threadID, messageID } = event;
    const musicName = args.join(" ");

    if (!musicName) {
      return api.sendMessage('🎵 اكتب اسم الأغنية يا زول.', threadID, messageID);
    }

    const searchMsg = await api.sendMessage('🚀 جاري التحميل، ثواني بس...', threadID);
    const cachePath = path.join(__dirname, 'cache', `music_${Date.now()}.mp3`);

    try {
      await fs.ensureDir(path.join(__dirname, 'cache'));

      // 1. البحث عن الأغنية والحصول على رابط التحميل (استخدام API سريعة)
      const searchRes = await axios.get(`https://api.vyturex.com/ytmp3?q=${encodeURIComponent(musicName)}`, { timeout: 20000 });
      const downloadUrl = searchRes.data.url;

      if (!downloadUrl) throw new Error('لم أجد الأغنية المطلوبة.');

      // 2. محاولة جلب الكلمات بشكل جانبي (اختياري)
      let lyricsText = "";
      try {
        const lyrRes = await axios.get(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(musicName)}`, { timeout: 5000 });
        if (lyrRes.data && lyrRes.data.lyrics) {
          lyricsText = `📜 *${lyrRes.data.title}*\n🎤 *${lyrRes.data.artist}*\n\n${lyrRes.data.lyrics}`;
        }
      } catch (e) { lyricsText = "📝 (لم يتم العثور على كلمات)"; }

      // 3. تحميل ملف الصوت الفعلي بمهلة زمنية
      const audioResponse = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 45000 // 45 ثانية كحد أقصى للتحميل
      });

      const writer = fs.createWriteStream(cachePath);
      audioResponse.data.pipe(writer);

      writer.on('finish', async () => {
        // إرسال الكلمات أولاً إذا كانت موجودة
        if (lyricsText.length > 50) {
           await api.sendMessage(lyricsText, threadID);
        }

        // إرسال الملف
        await api.sendMessage({
          body: `🎧 تفضل الأغنية: ${musicName}\n✅ استمتع!`,
          attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

        api.unsendMessage(searchMsg.messageID);
      });

      writer.on('error', (err) => { throw err; });

    } catch (error) {
      console.error(error);
      api.unsendMessage(searchMsg.messageID);
      api.sendMessage(`❌ فشل التحميل. السيرفر بطيء حالياً، حاول مرة أخرى أو جرب اسم أغنية أوضح.`, threadID, messageID);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
  }
};

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "اغنية",
    version: "1.6",
    author: "Gemini AI",
    countDown: 5,
    prefix: true,
    category: "media",
    description: "تحميل الأغاني من سيرفرات عالية السرعة",
    guide: { ar: "{pn} اسم_الأغنية" }
  },

  onStart: async ({ event, api, args }) => {
    const { threadID, messageID } = event;
    const musicName = args.join(" ");

    if (!musicName) {
      return api.sendMessage('🎵 يا زول اكتب اسم الأغنية!', threadID, messageID);
    }

    const searchMsg = await api.sendMessage('⏳ جاري البحث والتحضير... خليك قريب', threadID);
    const cachePath = path.resolve(__dirname, 'cache', `music_${Date.now()}.mp3`);

    try {
      await fs.ensureDir(path.join(__dirname, 'cache'));

      // 1. استخدام API بديلة قوية (سيرفر معالجة سريع)
      const searchUrl = `https://api.vyturex.com/ytmp3?q=${encodeURIComponent(musicName)}`;
      const response = await axios.get(searchUrl, { timeout: 30000 });
      const downloadLink = response.data.url;

      if (!downloadLink) {
        throw new Error('لم أجد رابطاً صالحاً للأغنية.');
      }

      // 2. جلب الكلمات (اختياري - لن يعطل الكود إذا فشل)
      let lyricsInfo = "";
      try {
        const lyrRes = await axios.get(`https://api.popcat.xyz/lyrics?song=${encodeURIComponent(musicName)}`, { timeout: 5000 });
        if (lyrRes.data && !lyrRes.data.error) {
          lyricsInfo = `📜 *${lyrRes.data.title}* - *${lyrRes.data.artist}*\n\n${lyrRes.data.lyrics.substring(0, 1000)}...`;
        }
      } catch (e) { /* استمرار بدون كلمات */ }

      // 3. تحميل الملف الفعلي وحفظه
      const audioBuffer = await axios.get(downloadLink, { 
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      });

      await fs.writeFile(cachePath, Buffer.from(audioBuffer.data));

      // 4. إرسال الكلمات (إذا وجدت) ثم الأغنية
      if (lyricsInfo) {
        await api.sendMessage(lyricsInfo, threadID);
      }

      await api.sendMessage({
        body: `✅ تم التحميل: ${musicName}\n🎧 استماع ممتع!`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

      api.unsendMessage(searchMsg.messageID);

    } catch (error) {
      console.error('Music Error:', error.message);
      api.unsendMessage(searchMsg.messageID);
      
      // رسالة خطأ ذكية تخبرك بالسبب الحقيقي
      const errorMsg = error.message.includes('timeout') 
        ? "⏳ السيرفر تأخر في الرد، جرب مرة ثانية." 
        : "❌ حصل مشكلة في السيرفر، جرب اسم أغنية مختلف أو حاول لاحقاً.";
      
      api.sendMessage(errorMsg, threadID, messageID);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
  }
};

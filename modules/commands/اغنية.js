const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "اغنية",
    version: "1.4",
    author: "Gemini AI",
    countDown: 10,
    prefix: true,
    category: "media",
    description: "تحميل الأغاني والكلمات عبر مصادر بديلة مستقرة",
    guide: { ar: "{pn} اسم_الأغنية" }
  },

  onStart: async ({ event, api, args }) => {
    const { threadID, messageID } = event;
    const musicName = args.join(" ");

    if (!musicName) {
      return api.sendMessage('🎵 اكتب اسم الأغنية يا زول.', threadID, messageID);
    }

    const searchMsg = await api.sendMessage('🔍 جاري البحث والتحميل من السيرفر البديل...', threadID);
    
    // استخدام API بديلة للتحميل (YouTube Music Engine)
    const downloadApi = `https://api.vyturex.com/ytmp3?q=${encodeURIComponent(musicName)}`;
    const lyricsApi = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(musicName)}`;
    
    const cachePath = path.join(__dirname, 'cache', `music_${Date.now()}.mp3`);

    try {
      await fs.ensureDir(path.join(__dirname, 'cache'));

      // 1. جلب الكلمات أولاً
      let lyricsText = "📝 لم يتم العثور على كلمات لهذه الأغنية.";
      try {
        const lyrRes = await axios.get(lyricsApi, { timeout: 5000 });
        if (lyrRes.data && lyrRes.data.lyrics) {
          lyricsText = `📜 كلمات: ${lyrRes.data.title}\n🎤 الفنان: ${lyrRes.data.artist}\n\n${lyrRes.data.lyrics}`;
        }
      } catch (e) { /* تجاهل خطأ الكلمات */ }

      // 2. طلب رابط التحميل
      const response = await axios.get(downloadApi);
      const audioUrl = response.data.url;

      if (!audioUrl) throw new Error('لم أتمكن من العثور على رابط تحميل مباشر.');

      // 3. تحميل الملف الفعلي
      const audioData = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(cachePath, Buffer.from(audioData.data));

      // 4. الإرسال
      await api.sendMessage(lyricsText, threadID);
      
      await api.sendMessage({
        body: `🎧 تم التحميل بنجاح!\n✅ استمتع بالاستماع.`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

      api.unsendMessage(searchMsg.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ السيرفر حالياً مضغوط، حاول مرة أخرى لاحقاً.\nالسبب: ${error.message}`, threadID, messageID);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    }
  }
};

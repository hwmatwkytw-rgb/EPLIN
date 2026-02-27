const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "بيكس",
    version: "1.2.0",
    author: "Kenji",
    countDown: 10,
    role: 0,
    description: "بحث وجلب صور من Pixiv بجودة عالية مع تحسين عدد النتائج",
    category: "ai",
    guide: { ar: "{pn} [كلمة البحث]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("⚠️ اكتب كلمة البحث! مثال: بيكسيف ناروتو", threadID, messageID);

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // زيادة عدد النتائج المطلوبة وتحسين الرابط
      const res = await axios.get("https://www.pixiv.net/touch/ajax/search/illusts", {
        params: { 
          word: query, 
          s_mode: "s_tag_full", 
          p: 1, 
          lang: "en",
          type: "illust_and_ugoira" // جلب الرسوم التوضيحية
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Referer": "https://www.pixiv.net/"
        }
      });

      const illusts = res.data.body.illusts;
      
      if (!illusts || illusts.length === 0) {
        return api.setMessageReaction("❌", messageID, () => {}, true);
      }

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const streams = [];
      // قمت برفع الحد الأقصى هنا إلى 9 صور (الفيسبوك يسمح بـ 10 مرفقات كحد أقصى)
      const limit = Math.min(illusts.length, 9);

      for (let i = 0; i < limit; i++) {
        const art = illusts[i];
        // استخدام سيرفر بديل (Proxy) لضمان جودة الصور وعدم حظر الطلب
        let imgUrl = art.url.replace("https://i.pximg.net", "https://i.pixiv.re");
        
        try {
          const imgRes = await axios.get(imgUrl, { 
            responseType: "arraybuffer", 
            timeout: 10000, // مهلة 10 ثواني لكل صورة
            headers: { "Referer": "https://www.pixiv.net/" } 
          });
          
          const filePath = path.join(cacheDir, `pixiv_${art.id}_${Date.now()}.jpg`);
          fs.writeFileSync(filePath, imgRes.data);
          streams.push(fs.createReadStream(filePath));
          
          // حذف الملف بعد الإرسال
          setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 60000);
        } catch (e) {
          // إذا فشلت صورة واحدة، سيكمل المحاولة مع البقية
          console.error(`فشل تحميل الصورة ${i}:`, e.message);
          continue; 
        }
      }

      if (streams.length === 0) {
        return api.setMessageReaction("❌", messageID, () => {}, true);
      }

      api.setMessageReaction("✅", messageID, () => {}, true);
      await api.sendMessage({
        body: `🖼️ تم العثور على ${streams.length} صور لـ: ${query}`,
        attachment: streams
      }, threadID, messageID);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

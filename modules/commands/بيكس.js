const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "بيكس",
    version: "1.1.0",
    author: "Kenji",
    countDown: 10,
    role: 0,
    description: "بحث وجلب صور من Pixiv بجودة عالية مع تفاعلات",
    category: "ai",
    guide: { ar: "{pn} [كلمة البحث]" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");

    if (!query) return api.sendMessage("⚠️ اكتب كلمة البحث! مثال: بيكسيف ناروتو", threadID, messageID);

    try {
      // ⏳ التفاعل بانتظار عند بدء البحث
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await axios.get("https://www.pixiv.net/touch/ajax/search/illusts", {
        params: { word: query, s_mode: "s_tag_full", p: 1, lang: "en" },
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          "Referer": "https://www.pixiv.net/"
        }
      });

      const illusts = res.data.body.illusts;
      
      // ❌ في حال عدم وجود نتائج
      if (!illusts || illusts.length === 0) {
        return api.setMessageReaction("❌", messageID, () => {}, true);
      }

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const streams = [];
      const limit = Math.min(illusts.length, 6);

      for (let i = 0; i < limit; i++) {
        const art = illusts[i];
        // تغيير الرابط لتجاوز الحظر
        let imgUrl = art.url.replace("https://i.pximg.net", "https://i.pixiv.re");
        
        try {
          const imgRes = await axios.get(imgUrl, { 
            responseType: "arraybuffer", 
            headers: { "Referer": "https://www.pixiv.net/" } 
          });
          const filePath = path.join(cacheDir, `pixiv_${art.id}_${Date.now()}.jpg`);
          fs.writeFileSync(filePath, imgRes.data);
          streams.push(fs.createReadStream(filePath));
          
          // حذف الملف بعد دقيقة لتوفير المساحة
          setTimeout(() => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, 60000);
        } catch (e) {
          continue;
        }
      }

      if (streams.length === 0) {
        return api.setMessageReaction("❌", messageID, () => {}, true);
      }

      // ✅ التفاعل بنجاح وإرسال الصور
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({
        body: `🖼️ نتائج البحث عن: ${query}`,
        attachment: streams
      }, threadID, messageID);

    } catch (err) {
      // ❌ تفاعل خطأ في حال تعطل السيرفر
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};

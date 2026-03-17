const axios = require("axios");

module.exports = {
  config: {
    name: "ميدجورني",
    version: "7.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 0,
    category: "ذكاء اصطناعي",
    guide: "{pn} [وصف الصورة]"
  },

  onStart: async function ({ api, event, args }) {
    let prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ | يا ملك، أكتب وصف للصورة!", event.threadID, event.messageID);

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // رابط API قوي وسريع جداً (Flux Model)
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux`;

      // طلب الصورة مع إضافة Headers عشان ما يدي "خطأ سيرفر"
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      await api.sendMessage({
        body: `✅ | أبشر يا أبو عبيدة، ابلين رسمت ليك:\n"${prompt}"`,
        attachment: response.data
      }, event.threadID, event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("خطأ ميدجورني:", error.message);
      // محاولة أخيرة برابط بديل لو الأول فشل
      try {
        const altUrl = `https://api.hercai.onrender.com/v3/text2img?prompt=${encodeURIComponent(prompt)}`;
        const altRes = await axios.get(altUrl);
        const finalImg = await axios.get(altRes.data.url, { responseType: "stream" });
        
        await api.sendMessage({
          body: `✅ | تم التوليد عبر السيرفر الاحتياطي:`,
          attachment: finalImg.data
        }, event.threadID, event.messageID);
      } catch (e) {
        api.sendMessage("❌ | السيرفرات كلها مشغولة حالياً، جرب كمان شوية يا بطل.", event.threadID, event.messageID);
      }
    }
  }
};

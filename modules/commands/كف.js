const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "كف",
    version: "1.1",
    author: "سينكو",
    countDown: 5,
    category: "fun",
    guide: "{pn} @منشن"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, mentions } = event;

    // التأكد من وجود منشن
    if (Object.keys(mentions).length == 0) {
      return api.sendMessage("⚠️ يرجى منشن الشخص الذي تريد صفعه!", threadID, messageID);
    }

    const victimID = Object.keys(mentions)[0];
    const path = __dirname + `/cache/slap_${victimID}.png`;
    
    // رابط صورة الضحية مع التوكن لضمان عملها
    const fbAvatar = `https://graph.facebook.com/${victimID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
      // استخدام encodeURIComponent للتأكد من أن الرابط يُقرأ بشكل صحيح من قبل الموقع
      const url = `https://api.popcat.xyz/ad?image=${encodeURIComponent(fbAvatar)}`;
      
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
      
      return api.sendMessage({
        body: "خُد لك كف! ",
        attachment: fs.createReadStream(path)
      }, threadID, () => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
      }, messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ تعذر معالجة الصورة حالياً، قد يكون السبب خصوصية حساب الشخص.", threadID, messageID);
    }
  }
};

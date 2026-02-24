const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "مطلوب",
    version: "1.1",
    author: "Kaguya-Project",
    category: "fun",
    guide: "{pn} [أو منشن]"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID, mentions } = event;
    
    // تحديد الآيدي: إما الشخص المذكور (منشن) أو صاحب الرسالة
    const id = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID;
    const path = __dirname + `/cache/wanted_${id}.png`;

    try {
      // استخدام رابط الصورة المباشر من فيسبوك
      const imageUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      
      // طلب الصورة من API popcat
      const res = await axios.get(`https://api.popcat.xyz/wanted?image=${encodeURIComponent(imageUrl)}`, {
        responseType: "arraybuffer"
      });

      fs.writeFileSync(path, Buffer.from(res.data, "utf-8"));

      return api.sendMessage({
        body: "🏴‍☠️ مطلوب حياً أو ميتاً!",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ فشل المحرك في رسم الصورة. تأكد من أن حساب الشخص متاح للعامة.", threadID, messageID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "كف",
    version: "1.0",
    author: "Kaguya-Project",
    countDown: 5,
    category: "صور",
    guide: "{pn} @منشن"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID, mentions } = event;
    if (Object.keys(mentions).length == 0) return api.sendMessage("⚠️ يرجى منشن الشخص الذي تريد صفعه!", threadID, messageID);

    const victimID = Object.keys(mentions)[0];
    const path = __dirname + `/cache/slap.png`;
    
    // رابط API الخاص بكاغويا لتوليد صورة الصفعة
    const url = `https://api.popcat.xyz/ad?image=https://graph.facebook.com/${victimID}/picture?width=512&height=512`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
      
      return api.sendMessage({
        body: "خُد لك كف! 😂",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);
    } catch (e) {
      return api.sendMessage("❌ تعذر معالجة الصورة حالياً.", threadID, messageID);
    }
  }
};

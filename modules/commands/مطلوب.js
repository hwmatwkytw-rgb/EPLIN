const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "مطلوب",
    version: "1.0",
    author: "Kaguya-Project",
    category: "fun",
    guide: "{pn} [أو منشن]"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID, mentions } = event;
    const id = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : senderID;
    const path = __dirname + `/cache/wanted.png`;

    try {
      const url = `https://api.popcat.xyz/wanted?image=https://graph.facebook.com/${id}/picture?width=512&height=512`;
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

      return api.sendMessage({
        body: "🏴‍☠️ مطلوب حياً أو ميتاً!",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);
    } catch (e) {
      return api.sendMessage("❌ فشل في استدعاء الصورة.", threadID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "انمي",
    version: "2.0",
    author: "Kaguya-Project",
    countDown: 10,
    category: "صور",
    guide: "قم بالرد على صورة بكلمة {pn}"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, type, messageReply } = event;
    let imageUrl;

    if (type === "message_reply" && messageReply.attachments[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
    } else {
      return api.sendMessage("❌ يرجى الرد على صورة لتحويلها!", threadID, messageID);
    }

    api.sendMessage("⏳ جاري تحويل الصورة إلى أنمي.. قد يستغرق ذلك ثواني", threadID);

    try {
      const res = await axios.get(`https://api.samirxp.me/ai/anime?url=${encodeURIComponent(imageUrl)}`, { responseType: "arraybuffer" });
      const path = __dirname + `/cache/anime_${senderID}.png`;
      fs.writeFileSync(path, Buffer.from(res.data, "utf-8"));

      return api.sendMessage({
        body: "✨ تفضل، صورتك بنمط الأنمي:",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);
    } catch (e) {
      return api.sendMessage("❌ فشل الخادم في معالجة الصورة.", threadID);
    }
  }
};

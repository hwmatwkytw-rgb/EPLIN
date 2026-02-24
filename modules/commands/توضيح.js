const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "توضيح",
    version: "1.5",
    author: "Kaguya-Project",
    category: "ai",
    guide: "رد على صورة بكلمة {pn}"
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;
    if (!messageReply || !messageReply.attachments[0]) return api.sendMessage("⚠️ رد على الصورة التي تريد توضيحها.", threadID);

    const imgUrl = messageReply.attachments[0].url;
    api.sendMessage("🚀 جاري رفع جودة الصورة.. انتظر قليلاً", threadID);

    try {
      const res = await axios.get(`https://api.aliestercrowley.com/api/upscale?url=${encodeURIComponent(imgUrl)}`, { responseType: "arraybuffer" });
      const path = __dirname + `/cache/remini.png`;
      fs.writeFileSync(path, Buffer.from(res.data, "utf-8"));

      return api.sendMessage({
        body: "✅ تم تحسين الجودة بنجاح!",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);
    } catch (err) {
      return api.sendMessage("❌ حدث خطأ أثناء معالجة الصورة.", threadID);
    }
  }
};

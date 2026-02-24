const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ارسم",
    version: "1.1",
    author: "Kaguya",
    category: "ذكاء اصطناعي",
    guide: "{pn} [وصف الصورة بالإنجليزية]"
  },

  onStart: async ({ api, event, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("🎨 اكتب وصفاً للصورة التي تريد رسمها!", event.threadID);

    api.sendMessage("⏳ جاري رسم خيالك... انتظر قليلاً", event.threadID);

    try {
      const path = __dirname + `/cache/ai_draw.png`;
      const url = `https://api.samirxp.me/imagine?prompt=${encodeURIComponent(prompt)}`;
      
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

      return api.sendMessage({
        body: `✅ النتيجة لـ: ${prompt}`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path));
    } catch (e) {
      return api.sendMessage("❌ فشل المحرك في رسم الصورة.", event.threadID);
    }
  }
};

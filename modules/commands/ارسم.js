const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ارسم",
    version: "1.5",
    author: "سينكو 17Y",
    countDown: 15,
    category: "ذكاء اصطناعي",
    guide: { ar: "{pn} [وصف بالإنجليزية]" }
  },

  onStart: async ({ api, event, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ يرجى كتابة وصف للصورة (بالإنجليزي).", event.threadID);

    api.sendMessage("🎨 جاري رسم خيالك.. يرجى الانتظار ثواني", event.threadID);

    try {
      const path = __dirname + `/cache/ai_art.png`;
      // هذا الرابط مجاني حالياً ولا يحتاج مفتاح
      const url = `https://api.samirxp.me/imagine?prompt=${encodeURIComponent(prompt)}`;
      
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data));

      const msg = `
╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      


  •——◤ 📝 الـوصف : ${prompt} ◥——•
  •——◤  الـمحرك : AI Draw ◥——•
  


      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path));

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ عذراً، المحرك مشغول حالياً، حاول مرة أخرى لاحقاً.", event.threadID);
    }
  }
};

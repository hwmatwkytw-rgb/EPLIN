const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ارسم",
    version: "2.5",
    author: "سينكو 17Y",
    countDown: 20,
    category: "ذكاء اصطناعي",
    guide: { ar: "{pn} [وصف بالإنجليزية]" }
  },

  onStart: async ({ api, event, args }) => {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ اكتب وصفاً للصورة (بالإنجليزي) لكي أرسمها لك.", event.threadID);

    // ضع مفتاحك هنا بالكامل (الذي يبدأ بـ key_)
    const API_KEY = "Key-28...cmx"; 

    api.sendMessage("⏳ جاري رسم خيالك باستخدام ذكاء GetImg.. انتظر قليلاً", event.threadID);

    try {
      const path = __dirname + `/cache/ai_result.png`;
      
      const response = await axios.post("https://api.getimg.ai/v1/essential/text-to-image", {
        prompt: prompt,
        style: "essential",
        output_format: "png"
      }, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      const imageBuffer = Buffer.from(response.data.image, 'base64');
      fs.writeFileSync(path, imageBuffer);

      const msg = `
╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      


  •——◤ 📝 الـوصف : ${prompt} ◥——•
  •——◤ 🤖 الـمحرك : GetImg AI ◥——•
  



╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path));

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ فشل المحرك. تأكد أن المفتاح يعمل ولم ينفد رصيد الصور المجانية.", event.threadID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدلي',
    aliases: ['sd', 'dream'],
    version: '9.0.0',
    author: 'SINKO',
    twitter: 'https://twitter.com/Sinko_Dev',
    description: 'كود التوليد الذكي - نظام المحاولات المتعددة',
    countDown: 5,
    prefix: true,
    category: 'owner',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572";
    const HF_TOKEN = "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"; 

    if (senderID !== developerID) return api.setMessageReaction("🚯", messageID, (err) => {}, true);

    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage('●─────── ❌ اكتب وصفاً للصورة ───────●', threadID, messageID);

    api.setMessageReaction("⚙️", messageID, (err) => {}, true);
    const waitingMsg = await api.sendMessage('◄ جاري المحاولة عبر السيرفر الرئيسي... ►', threadID, messageID);

    const cachePath = path.join(__dirname, "cache", `final_${Date.now()}.png`);
    if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

    // المحاولة الأولى: Hugging Face
    try {
      const hfResponse = await axios({
        method: 'post',
        url: "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        headers: { "Authorization": `Bearer ${HF_TOKEN}` },
        data: { inputs: prompt, options: { wait_for_model: true } },
        responseType: 'arraybuffer',
        timeout: 40000
      });
      await fs.writeFile(cachePath, hfResponse.data);
    } catch (e) {
      // المحاولة الثانية: لو فشل الأول، جرب Pollinations فوراً
      console.log("Switching to Backup Server...");
      try {
        const seed = Math.floor(Math.random() * 999999);
        const pollUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
        const pollRes = await axios({ url: pollUrl, responseType: 'arraybuffer', timeout: 60000 });
        await fs.writeFile(cachePath, pollRes.data);
      } catch (err2) {
        return api.editMessage('●─────── ❌ جميع السيرفرات مشغولة حالياً ───────●', waitingMsg.messageID);
      }
    }

    // إرسال النتيجة
    await api.sendMessage({
      body: `╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n      ✨ نـتـيـجـة الـتـولـيـد ✨\n──────────────────\n  •——◤ ✅ اشتغل بنجاح ◥——•\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      api.unsendMessage(waitingMsg.messageID);
    }, messageID);
    
    api.setMessageReaction("✅", messageID, () => {}, true);
  }
};

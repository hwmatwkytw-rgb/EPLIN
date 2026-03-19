const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "ابلين_صوت",
    version: "7.0.0",
    author: "SINKO",
    category: "ai"
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, attachments } = event;
    if (!attachments || attachments[0].type !== "audio") return;

    const apiKey = "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"; // حط مفتاحك هنا ضروري

    try {
      api.setMessageReaction("🎧", messageID, () => {}, true);

      // إنشاء مجلد الكاش لو ما موجود (عشان ما يدي خطأ رندر)
      const cacheDir = path.join(process.cwd(), 'cache');
      await fs.ensureDir(cacheDir);
      
      const userAudioPath = path.join(cacheDir, `user_${Date.now()}.mp3`);

      // تحميل صوتك
      const res = await axios.get(attachments[0].url, { responseType: 'arraybuffer' });
      await fs.writeFile(userAudioPath, Buffer.from(res.data));

      // إرسال لـ Whisper
      const form = new FormData();
      form.append("file", fs.createReadStream(userAudioPath));
      form.append("model", "whisper-1");

      const whisper = await axios.post("https://api.openai.com/v1/audio/transcriptions", form, {
        headers: { ...form.getHeaders(), "Authorization": `Bearer ${apiKey}` }
      });

      const userText = whisper.data.text;

      // رد ابلين الردّاح (ممكن تربطه بـ SimSimi أو Gemini)
      let reply = `سمعتك يا وهم.. قلت: "${userText}" .. قايل صوتك سمح؟ سجمك 😒`;

      const eblinPath = path.join(cacheDir, `eblin_${Date.now()}.mp3`);
      const tts = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=ar&client=tw-ob`, { responseType: 'arraybuffer' });
      await fs.writeFile(eblinPath, Buffer.from(tts.data));

      await api.sendMessage({
        body: `•-• ابلين سمعتك وردت:`,
        attachment: fs.createReadStream(eblinPath)
      }, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        [userAudioPath, eblinPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
      }, messageID);

    } catch (e) {
      api.sendMessage("•-• ابلين اتصممت من ردمك.. في مشكلة في الـ API يا وهم 😒", threadID);
    }
  },
  
  onStart: async () => {} // خليه فاضي عشان يشتغل تلقائي بس
};

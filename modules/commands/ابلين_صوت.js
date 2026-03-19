const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "ابلين_صوت",
    version: "8.0.0",
    author: "SINKO",
    category: "ai"
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, attachments } = event;
    if (!attachments || attachments.length === 0 || attachments[0].type !== "audio") return;

    // المفتاح بتاعك يا ملك
    const apiKey = "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";

    try {
      api.setMessageReaction("🎧", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), 'cache');
      await fs.ensureDir(cacheDir);
      const userAudioPath = path.join(cacheDir, `user_${Date.now()}.mp3`);

      // 1. تحميل الريكورد بصيغة صحيحة
      const res = await axios.get(attachments[0].url, { responseType: 'arraybuffer' });
      await fs.writeFile(userAudioPath, Buffer.from(res.data));

      // 2. الفهم (Whisper API) - الطريقة المضمونة للـ Headers
      const form = new FormData();
      form.append("file", fs.createReadStream(userAudioPath));
      form.append("model", "whisper-1");
      form.append("language", "ar");

      const whisper = await axios.post("https://api.openai.com/v1/audio/transcriptions", form, {
        headers: {
          ...form.getHeaders(),
          "Authorization": `Bearer ${apiKey}`
        }
      });

      const userText = whisper.data.text;

      // 3. التفكير (رد ابلين الردّاح)
      // ملاحظة: لو عندك API بتاع ذكاء اصطناعي حطه هنا، حالياً هو بيرد رد ثابت ردّاح
      let reply = `سمعتك يا رمة.. قلت: "${userText}" .. قايل صوتك حلو؟ سجمك وسجم الـ جابك 😒`;

      // 4. النطق (TTS)
      const eblinPath = path.join(cacheDir, `eblin_${Date.now()}.mp3`);
      const tts = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=ar&client=tw-ob`, { responseType: 'arraybuffer' });
      await fs.writeFile(eblinPath, Buffer.from(tts.data));

      // 5. الإرسال
      await api.sendMessage({
        body: `●───── ⌬ ─────●\n┇ ⦿ ابلين الردّاحة 🗣️\n●───── ⌬ ─────●`,
        attachment: fs.createReadStream(eblinPath)
      }, threadID, () => {
        api.setMessageReaction("✅", messageID, () => {}, true);
        if (fs.existsSync(userAudioPath)) fs.unlinkSync(userAudioPath);
        if (fs.existsSync(eblinPath)) fs.unlinkSync(eblinPath);
      }, messageID);

    } catch (e) {
      console.error(e.response ? e.response.data : e); // عشان نشوف المشكلة في الكونسول
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  },
  
  onStart: async () => {} 
};

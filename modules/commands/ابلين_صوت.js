const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "ابلين_صوت",
    version: "6.0.0",
    author: "محمد & AbuUbaida",
    category: "ai"
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, attachments } = event;

    // المراقب: إذا وصل ريكورد (audio)
    if (attachments && attachments[0] && attachments[0].type === "audio") {
      const audioUrl = attachments[0].url;
      const apiKey = "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"; // ضع مفتاحك هنا

      try {
        api.setMessageReaction("🎧", messageID, () => {}, true);

        const cacheDir = path.join(__dirname, 'cache');
        await fs.ensureDir(cacheDir);
        const userAudioPath = path.join(cacheDir, `user_${Date.now()}.mp3`);

        // 1. تحميل ريكورد المستخدم (منطق الأري بفر)
        const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(userAudioPath, Buffer.from(audioRes.data));

        // 2. الفهم (Whisper API) - تحويل صوتك لنص
        const formData = new FormData();
        formData.append("file", fs.createReadStream(userAudioPath));
        formData.append("model", "whisper-1");
        formData.append("language", "ar"); // ليفهم العربي والسوداني

        const whisperRes = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
          headers: {
            ...formData.getHeaders(),
            "Authorization": `Bearer ${apiKey}`
          }
        });

        const userText = whisperRes.data.text; // النص اللي انت قلته في الريكورد

        // 3. التفكير (ذكاء ابلين الردّاحة)
        // هنا نستخدم نفس منطق الرد اللي بنيته انت
        let reply = `سمعتك يا وهم وقفت لي شعري.. قايلني ما بفهم؟ قلت: "${userText}" .. سجمك وسجم الـ جابك 😒`;

        // 4. النطق (تحويل رد ابلين لصوت)
        const eblinAudioPath = path.join(cacheDir, `eblin_${Date.now()}.mp3`);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(reply)}&tl=ar&client=tw-ob`;
        
        const voiceRes = await axios.get(ttsUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(eblinAudioPath, Buffer.from(voiceRes.data));

        // 5. الإرسال النهائي
        await api.sendMessage({
          body: `•-• ابلين سمعت كلامك وقالت ليك:`,
          attachment: fs.createReadStream(eblinAudioPath)
        }, threadID, () => {
          api.setMessageReaction("✅", messageID, () => {}, true);
          if (fs.existsSync(userAudioPath)) fs.unlinkSync(userAudioPath);
          if (fs.existsSync(eblinAudioPath)) fs.unlinkSync(eblinAudioPath);
        }, messageID);

      } catch (e) {
        console.error("Whisper Error:", e);
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
    }
  }
};

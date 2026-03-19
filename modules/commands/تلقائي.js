const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "تلقائي",
    version: "2.0.0",
    author: "AbuUbaida & Cenko",
    countDown: 0,
    role: 0,
    category: "system"
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID, type } = event;
    if (type !== "message" && type !== "message_reply") return;
    if (!body) return;

    const input = body.trim();

    // رادارات المنصات
    const fbReg = /(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.*/gi;
    const igReg = /(https?:\/\/)?(www\.)?instagram\.com\/.*/gi;
    const ttReg = /https:\/\/(www\.|vt\.|vm\.)?tiktok\.com\/[\w\.-]+\/?/gi;
    const ytReg = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*/gi;

    if (fbReg.test(input) || igReg.test(input) || ttReg.test(input) || ytReg.test(input)) {
      const urlMatch = input.match(fbReg) || input.match(igReg) || input.match(ttReg) || input.match(ytReg);
      const videoUrlStr = urlMatch[0];

      try {
        // تفاعل "الساعة" عشان المستخدم يعرف إن البوت شغال
        api.setMessageReaction("⌚", messageID, () => {}, true);

        let apiUrl;
        // الـ APIs اللي إنت بتثق فيها
        if (fbReg.test(videoUrlStr)) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/facebook2?url=${encodeURIComponent(videoUrlStr)}&apikey=hridoyXQC`;
        } else if (igReg.test(videoUrlStr)) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/instagram?url=${encodeURIComponent(videoUrlStr)}&apikey=hridoyXQC`;
        } else if (ttReg.test(videoUrlStr)) {
          apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(videoUrlStr)}`;
        } else if (ytReg.test(videoUrlStr)) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/ytmp4?url=${encodeURIComponent(videoUrlStr)}&format=1080&apikey=hridoyXQC`;
        }

        const response = await axios.get(apiUrl);
        let downloadUrl;

        // استخراج الرابط المباشر من الـ API (كل واحد ومساره)
        if (ttReg.test(videoUrlStr)) {
          downloadUrl = response.data.video?.noWatermark || response.data.video?.watermark;
        } else if (fbReg.test(videoUrlStr)) {
          downloadUrl = response.data.video_HD?.url || response.data.video_SD?.url;
        } else if (igReg.test(videoUrlStr)) {
          downloadUrl = response.data.downloadUrl;
        } else if (ytReg.test(videoUrlStr)) {
          downloadUrl = response.data.result?.download;
        }

        if (downloadUrl) {
          // التحميل المؤقت في الكاش
          const cacheDir = path.join(__dirname, 'cache');
          await fs.ensureDir(cacheDir);
          const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

          const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
          await fs.writeFile(filePath, Buffer.from(videoRes.data));

          await api.sendMessage({
            body: "✅ | تم التحميل تلقائياً بواسطة ابلين",
            attachment: fs.createReadStream(filePath)
          }, threadID, () => {
            api.setMessageReaction("✅", messageID, () => {}, true);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, messageID);
        }
      } catch (e) {
        console.log("Error Auto Download:", e);
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("نظام التحميل التلقائي (تيك توك، فيسبوك، إنستا، يوتيوب) شغال في الخلفية يا ملك! 🚀", event.threadID);
  }
};

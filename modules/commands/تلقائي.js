const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "تلقائي",
    version: "3.0.0",
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
    const fbReg = /(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.*/gi;
    const igReg = /(https?:\/\/)?(www\.)?instagram\.com\/.*/gi;
    const ttReg = /https:\/\/(www\.|vt\.|vm\.)?tiktok\.com\/[\w\.-]+\/?/gi;
    const ytReg = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*/gi;

    if (fbReg.test(input) || igReg.test(input) || ttReg.test(input) || ytReg.test(input)) {
      const urlMatch = input.match(fbReg) || input.match(igReg) || input.match(ttReg) || input.match(ytReg);
      const url = urlMatch[0];

      try {
        api.setMessageReaction("⌚", messageID, () => {}, true);

        let apiUrl, downloadKey;
        // نفس الـ APIs والـ Keys من كودك الأصلي
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/facebook2?url=${encodeURIComponent(url)}&apikey=hridoyXQC`;
          downloadKey = 'video_HD.url';
        } else if (url.includes('instagram.com')) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/instagram?url=${encodeURIComponent(url)}&apikey=hridoyXQC`;
          downloadKey = 'downloadUrl';
        } else if (url.includes('tiktok.com')) {
          apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        } else if (url.includes('youtu.be') || url.includes('youtube.com')) {
          apiUrl = `https://hridoy-apis.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}&format=1080&apikey=hridoyXQC`;
          downloadKey = 'result.download';
        }

        const response = await axios.get(apiUrl);
        
        let downloadUrl;
        if (url.includes('tiktok.com')) {
            downloadUrl = response.data.video?.noWatermark || response.data.video?.watermark;
        } else {
            // الطريقة الذكية اللي إنت مستخدمها لتفصيص الـ JSON (الـ reduce)
            downloadUrl = downloadKey.split('.').reduce((obj, key) => obj && obj[key], response.data);
        }

        if (downloadUrl) {
          const cacheDir = path.join(__dirname, 'cache');
          await fs.ensureDir(cacheDir);
          const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

          // "الزيت" هنا: استخدام arraybuffer و Buffer.from زي كودك بالظبط
          const videoRes = await axios.get(downloadUrl, { 
            responseType: 'arraybuffer', 
            timeout: 100000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          
          await fs.writeFile(filePath, Buffer.from(videoRes.data));

          await api.sendMessage({
            body: `●───── ⌬ ─────●\n┇ ⦿ تـم الـتـحـمـيـل تـلـقـائـيـاً ✅\n●───── ⌬ ─────●`,
            attachment: fs.createReadStream(filePath)
          }, threadID, () => {
            api.setMessageReaction("✅", messageID, () => {}, true);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }, messageID);
        }
      } catch (e) {
        console.error("Auto Download Error:", e);
        api.setMessageReaction("❌", messageID, () => {}, true);
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("نظام التحميل التلقائي (بمنطق كود سينكو) شغال! 🚀", event.threadID);
  }
};

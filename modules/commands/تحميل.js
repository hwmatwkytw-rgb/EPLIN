const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'تحميل',
    version: '1.6',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    description: 'تحميل الفيديوهات مع تفاعلات تلقائية وزخرفة المسار الطولي.',
    category: 'media',
    guide: {
      ar: '{pn} <رابط_الفيديو>'
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const url = args.join(' ').trim();

    if (!url || !url.startsWith('https://')) {
      return api.sendMessage(
        "●───── ⌬ ─────●\n" +
        "┇ ⚠️ يرجى إدخال رابط فيديو صحيح\n" +
        "●───── ⌬ ─────●", 
        threadID, messageID
      );
    }

    // التفاعل بالساعة عند بدء العمل
    api.setMessageReaction("⌚", messageID, () => {}, true);

    let statusMsg;
    try {
      statusMsg = await new Promise((resolve) => {
        api.sendMessage("●───── ⌬ ─────●\n┇ 🔎 جاري معالجة الرابط...\n●───── ⌬ ─────●", threadID, (err, info) => {
          resolve(info);
        }, messageID);
      });

      let apiUrl, downloadKey;

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
      } else {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.editMessage("●───── ⌬ ─────●\n┇ ❌ عذراً، الرابط غير مدعوم\n●───── ⌬ ─────●", statusMsg.messageID);
      }

      const response = await axios.get(apiUrl);
      
      let downloadUrl;
      if (url.includes('tiktok.com')) {
          downloadUrl = response.data.video?.noWatermark || response.data.video?.watermark;
      } else {
          downloadUrl = downloadKey.split('.').reduce((obj, key) => obj && obj[key], response.data);
      }

      if (!downloadUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.editMessage("●───── ⌬ ─────●\n┇ ❌ فشل العثور على ملف الفيديو\n●───── ⌬ ─────●", statusMsg.messageID);
      }

      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `video_${Date.now()}.mp4`);

      const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 100000 });
      await fs.writeFile(filePath, Buffer.from(videoRes.data));

      const title = response.data.result?.title || response.data.data?.title || response.data.title || 'فيديو ميديا';

      await api.sendMessage({
        body: `●───── ⌬ ─────●\n┇ ⦿ ⟬ تـم الـتـحـمـيـل ✅ ⟭\n┇\n┇ 𓋰 الـعـنـوان: ${title}\n●───── ⌬ ─────●`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // التفاعل بعلامة الصح عند النجاح
        api.setMessageReaction("✅", messageID, () => {}, true);
        fs.unlinkSync(filePath);
        api.unsendMessage(statusMsg.messageID);
      }, messageID);

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      if (statusMsg) api.unsendMessage(statusMsg.messageID);
      api.sendMessage("●───── ⌬ ─────●\n┇ ❌ حدث خطأ أثناء التحميل\n●───── ⌬ ─────●", threadID);
    }
  }
};

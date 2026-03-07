const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

// ضع مفتاح API الخاص بـ ImgBB هنا
const IMGBB_API_KEY = "3963d5cc3ee64b07508b20f76a9e8bbd"; 

module.exports = {
  config: {
    name: "لينز",
    version: "2.0.0",
    author: "سينكو",
    countDown: 10,
    role: 0,
    description: "البحث عن صور مشابهة عبر ImgBB + Yandex",
    category: "ai",
    guide: { ar: "{pn} (رد على صورة)" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const downloadedFiles = [];

    try {
      if (!messageReply?.attachments?.[0]) {
        return api.sendMessage("❌ يرجى الرد على صورة للبحث عنها.", threadID, messageID);
      }

      const imageUrl = messageReply.attachments[0].url;
      await fs.ensureDir(cacheDir);

      api.sendMessage("🔍 جاري المعالجة والرفع... انتظر قليلاً", threadID, messageID);

      // 1. الرفع إلى ImgBB للحصول على رابط ثابت
      const imgbbUrl = await uploadToImgBB(imageUrl);
      if (!imgbbUrl) return api.sendMessage("❌ فشل رفع الصورة إلى الخادم المؤقت.", threadID, messageID);

      // 2. البحث في Yandex باستخدام الرابط
      const searchResults = await searchSimilarImages(imgbbUrl);
      if (!searchResults || searchResults.length === 0) {
        return api.sendMessage("❌ لم يتم العثور على نتائج مطابقة.", threadID, messageID);
      }

      // 3. تحميل النتائج (أول 10 صور)
      for (let i = 0; i < Math.min(searchResults.length, 10); i++) {
        try {
          const res = await axios.get(searchResults[i].img_url, { responseType: 'arraybuffer' });
          const filePath = path.join(cacheDir, `res_${Date.now()}_${i}.jpg`);
          await fs.writeFile(filePath, res.data);
          downloadedFiles.push(fs.createReadStream(filePath));
        } catch (e) { continue; }
      }

      // 4. إرسال النتائج
      return api.sendMessage({
        body: `✅ تم العثور على ${downloadedFiles.length} صور مشابهة:`,
        attachment: downloadedFiles
      }, threadID, messageID);

    } catch (error) {
      return api.sendMessage(`❌ خطأ: ${error.message}`, threadID, messageID);
    }
  }
};

async function uploadToImgBB(url) {
  try {
    const res = await axios.get(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}&image=${encodeURIComponent(url)}`);
    return res.data.data.url;
  } catch (e) { return null; }
}

async function searchSimilarImages(directUrl) {
  try {
    const searchUrl = `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(directUrl)}`;
    const response = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' }
    });
    
    // استخراج روابط الصور من صفحة ياندكس (Regex بسيط)
    const matches = response.data.match(/"img_url":"([^"]+)"/g);
    if (!matches) return [];
    
    return matches.map(m => ({ img_url: m.split('"')[3] }));
  } catch (e) { return []; }
}

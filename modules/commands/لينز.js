const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "لينز",
    version: "2.0.0",
    author: "سينكو",
    countDown: 10,
    role: 0,
    description: "البحث عن صور مشابهة",
    category: "ai",
    guide: { ar: "{pn} (رد على صورة)" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const downloadedFiles = [];

    try {
      if (!messageReply?.attachments?.[0]) {
        return api.sendMessage(`●─────── ⌬ ───────●
┇ ⦿ ⟬ عـدسـة الـبـحـث ⟭
┇
┇ الـحـالـة: ❌ لم تـرد على صـورة
┇ الـطـلـب: رد على صورة لـتـبـحـث عـنـهـا
●─────── ⌬ ───────●`, threadID, messageID);
      }

      const imageUrl = messageReply.attachments[0].url;
      if (!imageUrl) return api.sendMessage("❌ فشل جلب الصورة", threadID, messageID);

      await fs.ensureDir(cacheDir);
      api.sendMessage(`●─────── ⌬ ───────●
┇ ⦿ ⟬ جـاري الـمـعـالـجـة ⟭
┇
┇ الـوصـف: جـاري الـبـحـث عـن صـور مـشـابـهـة...
┇ الـحـالـة: جـاري الـتـخـيـل... ⏳
●─────── ⌬ ───────●`, threadID);

      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      // Try multiple search methods
      let searchResults = [];
      
      // Method 1: Try direct Google Reverse Image Search results
      searchResults = await searchGoogleImages(imageUrl);
      
      if (!searchResults || searchResults.length === 0) {
        // Method 2: Fallback - Try Bing Image Search
        searchResults = await searchBingImages(imageUrl);
      }

      if (!searchResults || searchResults.length === 0) {
        return api.sendMessage(`●─────── ⌬ ───────●
┇ ⦿ ⟬ نـتـائـج الـبـحـث ⟭
┇
┇ الـحـالـة: ❌ لم يـتـم الـعـثـور على صـور
┇ الـالـتـماس: جـرب صـورة أخـرى
●─────── ⌬ ───────●`, threadID, messageID);
      }

      // Download images
      let downloadedCount = 0;
      const maxImages = 12;

      for (let i = 0; i < searchResults.length && downloadedCount < maxImages; i++) {
        try {
          const imgUrl = searchResults[i];
          if (!imgUrl || !imgUrl.startsWith('http')) continue;

          const imgRes = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 8000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': 'https://www.google.com/'
            }
          });

          if (imgRes.data && imgRes.data.length > 5000) {
            const filePath = path.join(cacheDir, `lens_${Date.now()}_${downloadedCount}.jpg`);
            await fs.writeFile(filePath, imgRes.data);
            downloadedFiles.push(filePath);
            downloadedCount++;
          }
        } catch (e) {
          continue;
        }
      }

      if (downloadedFiles.length === 0) {
        return api.sendMessage(`●─────── ⌬ ───────●
┇ ⦿ ⟬ نـتـائـج الـبـحـث ⟭
┇
┇ الـحـالـة: ❌ فـشـل تـحـمـيـل الـصـور
┇ الـالـتـماس: جـرب مـرة أخـرى
●─────── ⌬ ───────●`, threadID, messageID);
      }

      // Send images
      const streams = downloadedFiles.map(f => fs.createReadStream(f));
      
      api.sendMessage({
        body: `●─────── ⌬ ───────●
┇ ⦿ ⟬ نـتـائـج الـبـحـث ⟭
┇
┇ الـعـدد: ${downloadedFiles.length} صـورة
┇ الـمـصـدر: الـويـب
┇ الـحـالـة: تـم الـعـثـور ✅
●─────── ⌬ ───────●`,
        attachment: streams
      }, threadID, () => {
        // Cleanup
        setTimeout(() => {
          downloadedFiles.forEach(f => {
            try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
          });
        }, 5000);
      }, messageID);

    } catch (error) {
      api.sendMessage(`❌ خـطـأ: ${error.message}`, threadID, messageID);
      downloadedFiles.forEach(f => {
        try { fs.unlinkSync(f); } catch (e) {}
      });
    }
  }
};

// Google Reverse Image Search
async function searchGoogleImages(imageUrl) {
  try {
    const encodedUrl = encodeURIComponent(imageUrl);
    const response = await axios.get(`https://www.google.com/searchbyimage?image_url=${encodedUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const results = [];
    const matches = response.data.matchAll(/imgurl=([^"&]+)/g);
    
    for (const match of matches) {
      try {
        const url = decodeURIComponent(match[1]);
        if (url.startsWith('http') && !results.includes(url)) {
          results.push(url);
          if (results.length >= 30) break;
        }
      } catch (e) {}
    }
    
    return results;
  } catch (error) {
    return [];
  }
}

// Bing Reverse Image Search
async function searchBingImages(imageUrl) {
  try {
    const encodedUrl = encodeURIComponent(imageUrl);
    const response = await axios.get(`https://www.bing.com/images/search?cbir=sbi&imgurl=${encodedUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const results = [];
    const matches = response.data.matchAll(/"murl":"([^"]+)"/g);
    
    for (const match of matches) {
      try {
        const url = match[1].replace(/\\\//g, '/');
        if (url.startsWith('http') && !results.includes(url)) {
          results.push(url);
          if (results.length >= 30) break;
        }
      } catch (e) {}
    }
    
    return results;
  } catch (error) {
    return [];
  }
          }

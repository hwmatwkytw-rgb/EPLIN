const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "لينز",
    version: "1.0.0",
    author: "سينكو",
    countDown: 10,
    role: 0,
    description: "البحث عن صور مشابهة باستخدام Yandex",
    category: "صور",
    guide: { ar: "{pn} (رد على صورة)" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, messageReply } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const downloadedFiles = [];
    const TARGET_IMAGES = 15;

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
┇ الـحـالـة: جـاري الـبـحـث عـن صـور مـشـابـهـة... ⏳
●─────── ⌬ ───────●`, threadID, messageID);

      // Download the original image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Dart/3.9 (dart:io)' }
      });

      // Upload to Yandex
      const uploadUrl = await uploadToYandex(imageResponse.data);
      if (!uploadUrl) {
        return api.sendMessage("❌ فشل رفع الصورة إلى Yandex", threadID, messageID);
      }

      // Search for similar images
      const searchResults = await searchSimilarImages(uploadUrl);
      if (!searchResults || searchResults.length === 0) {
        return api.sendMessage("❌ لم يتم العثور على صور مشابهة", threadID, messageID);
      }

      // Download images
      let downloadedCount = 0;
      for (let i = 0; i < searchResults.length && downloadedCount < TARGET_IMAGES; i++) {
        try {
          const imgUrl = searchResults[i].img_url || searchResults[i].thumb || searchResults[i].url;
          if (!imgUrl || !imgUrl.startsWith('http')) continue;

          const imgRes = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });

          const filePath = path.join(cacheDir, `lens_${Date.now()}_${downloadedCount}.jpg`);
          await fs.writeFile(filePath, imgRes.data);
          downloadedFiles.push(filePath);
          downloadedCount++;

        } catch (e) {
          continue;
        }
      }

      if (downloadedFiles.length === 0) {
        return api.sendMessage("❌ فشل تحميل الصور", threadID, messageID);
      }

      // Send images
      const streams = downloadedFiles.map(f => fs.createReadStream(f));
      
      api.sendMessage({
        body: `●─────── ⌬ ───────●
┇ ⦿ ⟬ نـتـائـج الـبـحـث ⟭
┇
┇ الـعـدد: ${downloadedFiles.length} صـورة
┇ الـمـصـدر: Yandex Images
┇ الـحـالـة: تـم الـعـثـور ✅
●─────── ⌬ ───────●`,
        attachment: streams
      }, threadID, () => {
        // Cleanup
        downloadedFiles.forEach(f => {
          setTimeout(() => fs.existsSync(f) && fs.unlinkSync(f), 5000);
        });
      }, messageID);

    } catch (error) {
      api.sendMessage(`❌ خـطـأ: ${error.message}`, threadID, messageID);
      downloadedFiles.forEach(f => {
        try { fs.unlinkSync(f); } catch (e) {}
      });
    }
  }
};

async function uploadToYandex(imageBuffer) {
  try {
    const form = new FormData();
    form.append('upfile', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const cookies = generateYandexCookies();
    const response = await axios.post('https://yandex.com/images/search?rpt=imageview&format=json', form, {
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies
      },
      maxRedirects: 5
    });

    if (response.data?.blocks) {
      for (const block of response.data.blocks) {
        if (block.params?.url) return block.params.url;
      }
    }

    const responseText = JSON.stringify(response.data);
    const urlMatch = responseText.match(/avatars\.mds\.yandex\.net\/get-images-cbir\/[^"'\s]+/);
    if (urlMatch) return 'https://' + urlMatch[0];

    const cbirMatch = responseText.match(/"cbir_id":"([^"]+)"/);
    if (cbirMatch) return `https://avatars.mds.yandex.net/get-images-cbir/${cbirMatch[1]}/orig`;

    return null;
  } catch (error) {
    console.error("Upload error:", error.message);
    return null;
  }
}

async function searchSimilarImages(imageUrl) {
  try {
    const cookies = generateYandexCookies();
    const searchUrl = `https://yandex.com/images/touch/search?p=0&url=${encodeURIComponent(imageUrl)}&rpt=imagelike&format=json`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
        'Accept-Encoding': 'gzip'
      }
    });

    const results = [];
    const seenUrls = new Set();

    if (response.data?.blocks) {
      for (const block of response.data.blocks) {
        if (block.html) {
          const dataMatches = block.html.matchAll(/data-bem='({[^']+})'/g);
          for (const match of dataMatches) {
            try {
              const data = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
              if (data['serp-item']) {
                const item = data['serp-item'];
                const imgUrl = item.img_url || item.thumb?.url;
                if (imgUrl && !seenUrls.has(imgUrl)) {
                  seenUrls.add(imgUrl);
                  results.push({
                    title: item.snippet?.title || '',
                    url: item.snippet?.url || '',
                    img_url: imgUrl
                  });
                }
              }
            } catch (e) {}
          }
        }

        if (block.items?.length) {
          for (const item of block.items) {
            const imgUrl = item.img_url || item.thumb?.url;
            if (imgUrl && !seenUrls.has(imgUrl)) {
              seenUrls.add(imgUrl);
              results.push({
                title: item.title || '',
                url: item.img_href || '',
                img_url: imgUrl
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Search error:", error.message);
    return [];
  }
}

function generateYandexCookies() {
  const timestamp = Date.now();
  const uid = Math.floor(Math.random() * 10000000000);
  return `yandexuid=${uid}${timestamp}; gdpr=0; _ym_uid=${timestamp}${Math.floor(Math.random() * 1000000)};`;
  }

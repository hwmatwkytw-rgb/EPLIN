const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "lens",
  Auth: 0,
  Owner: "Your Name",
  Info: "البحث عن صور مشابهة باستخدام Yandex",
  Class: "صور",
  Multi: ["findimg", "reverseimg"],
  Time: 5,
  How: "lens [رد على صورة] - للبحث عن صور مشابهة"
};

module.exports.onPick = async function({ sh, event, api }) {
  const DEBUG = true;
  const cacheDir = path.join(__dirname, 'cache');
  const downloadedFiles = [];
  const TARGET_IMAGES = 20;
  
  try {
    console.log("\n========== IMAGE SEARCH DEBUG START ==========");
    console.log("Event type:", event.type);
    console.log("Cache directory:", cacheDir);
    console.log("Target images:", TARGET_IMAGES);
    
    await fs.ensureDir(cacheDir);
    console.log("✅ Cache directory ensured");
    
    let imageUrl;
    
    if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      console.log("🔍 Found reply with attachments");
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === "photo") {
        imageUrl = attachment.url;
        console.log("✅ Image URL from reply:", imageUrl);
      }
    } else if (event.attachments && event.attachments.length > 0) {
      console.log("🔍 Found direct attachments");
      const attachment = event.attachments[0];
      if (attachment.type === "photo") {
        imageUrl = attachment.url;
        console.log("✅ Image URL from direct:", imageUrl);
      }
    }

    if (!imageUrl) {
      console.log("❌ No image URL found");
      console.log("========== IMAGE SEARCH DEBUG END ==========\n");
      return sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊⚠️ الرجاء الرد على صورة أو إرسال صورة مع الأمر!
◈ ──────────── ◈`);
    }

    const processingMsg = await sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊🔍 جاري البحث عن الصور المشابهة...
❁┊⏳ انتظر قليلاً
◈ ──────────── ◈`);
    console.log("📨 Processing message sent");

    console.log("\n--- Step 1: Downloading image ---");
    console.log("Downloading from:", imageUrl);
    
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Dart/3.9 (dart:io)',
        'Accept-Encoding': 'gzip'
      }
    });
    
    console.log("✅ Image downloaded, size:", imageResponse.data.length, "bytes");

    console.log("\n--- Step 2: Uploading to Yandex ---");
    const uploadUrl = await uploadToYandex(imageResponse.data, DEBUG);
    
    if (!uploadUrl) {
      console.log("❌ Upload failed");
      console.log("========== IMAGE SEARCH DEBUG END ==========\n");
      api.unsendMessage(processingMsg.messageID);
      return sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊❌ فشل رفع الصورة إلى Yandex
❁┊🔄 حاول مرة أخرى
◈ ──────────── ◈`);
    }
    
    console.log("✅ Upload successful, URL:", uploadUrl);

    console.log("\n--- Step 3: Searching for similar images ---");
    const searchResults = await searchSimilarImages(uploadUrl, DEBUG);
    
    console.log("Search results count:", searchResults ? searchResults.length : 0);
    if (searchResults && searchResults.length > 0) {
      console.log("First 3 results:");
      searchResults.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i}:`, {
          title: r.title,
          url: r.url,
          img_url: r.img_url,
          thumb: r.thumb
        });
      });
    }
    
    if (!searchResults || searchResults.length === 0) {
      console.log("❌ No results found");
      console.log("========== IMAGE SEARCH DEBUG END ==========\n");
      api.unsendMessage(processingMsg.messageID);
      return sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊❌ لم يتم العثور على صور مشابهة
❁┊💡 جرب صورة أخرى
◈ ──────────── ◈`);
    }

    console.log("\n--- Step 4: Downloading images to cache (SMART RETRY) ---");
    console.log(`🎯 Target: ${TARGET_IMAGES} images`);
    
    const imageStreams = [];
    let currentIndex = 0;
    const maxAttempts = Math.min(searchResults.length, TARGET_IMAGES * 3);
    let attempts = 0;

    while (imageStreams.length < TARGET_IMAGES && currentIndex < searchResults.length && attempts < maxAttempts) {
      try {
        const result = searchResults[currentIndex];
        const imgUrl = result.img_url || result.thumb || result.url;
        
        console.log(`\n[Attempt ${attempts + 1}] [Index ${currentIndex}] [Downloaded: ${imageStreams.length}/${TARGET_IMAGES}]`);
        console.log(`  URL: ${imgUrl}`);
        
        if (imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))) {
          const imgResponse = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          console.log(`  ✅ Downloaded successfully, size: ${imgResponse.data.length} bytes`);
          
          const fileName = `lens_${Date.now()}_${imageStreams.length}.jpg`;
          const filePath = path.join(cacheDir, fileName);
          await fs.writeFile(filePath, imgResponse.data);
          
          console.log(`  ✅ Saved to: ${filePath}`);
          
          downloadedFiles.push(filePath);
          imageStreams.push(fs.createReadStream(filePath));
          
          console.log(`  📊 Progress: ${imageStreams.length}/${TARGET_IMAGES} images collected`);
        } else {
          console.log(`  ⚠️ Invalid URL, skipping...`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to download:`, error.message);
        if (error.response) {
          console.error(`    HTTP Status: ${error.response.status}`);
        }
        console.log(`  🔄 Will try next image...`);
      }
      
      currentIndex++;
      attempts++;
    }

    console.log(`\n📊 Final Statistics:`);
    console.log(`  ✅ Successfully downloaded: ${imageStreams.length} images`);
    console.log(`  🎯 Target was: ${TARGET_IMAGES} images`);
    console.log(`  🔢 Total attempts: ${attempts}`);
    console.log(`  📁 Files saved: ${downloadedFiles.length}`);

    api.unsendMessage(processingMsg.messageID);
    console.log("✅ Processing message deleted");

    console.log("\n--- Step 5: Sending images ---");
    if (imageStreams.length > 0) {
      console.log(`Sending ${imageStreams.length} images...`);
      await sh.reply({
        body: `◈ ──『 ❀ Lens ❀ 』── ◈
❁┊✅ تم العثور على ${imageStreams.length} صورة مشابهة
❁┊🎨 جودة عالية من Yandex
◈ ──────────── ◈`,
        attachment: imageStreams
      });
      console.log("✅ Images sent successfully");
      
      console.log("\n--- Step 6: Cleaning up cache ---");
      for (const filePath of downloadedFiles) {
        try {
          await fs.unlink(filePath);
          console.log(`  ✅ Deleted: ${path.basename(filePath)}`);
        } catch (error) {
          console.error(`  ❌ Failed to delete ${filePath}:`, error.message);
        }
      }
      console.log("✅ Cache cleaned");
    } else {
      console.log("❌ No images to send");
      return sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊❌ فشل تحميل الصور المشابهة
❁┊🔄 حاول مرة أخرى
◈ ──────────── ◈`);
    }

    console.log("========== IMAGE SEARCH DEBUG END ==========\n");

  } catch (error) {
    console.error("\n❌❌❌ CRITICAL ERROR ❌❌❌");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    console.log("\n--- Emergency cleanup ---");
    for (const filePath of downloadedFiles) {
      try {
        await fs.unlink(filePath);
        console.log(`  ✅ Deleted: ${path.basename(filePath)}`);
      } catch (e) {
        console.error(`  ❌ Failed to delete: ${e.message}`);
      }
    }
    
    console.error("========== IMAGE SEARCH DEBUG END ==========\n");
    return sh.reply(`◈ ──『 ❀ Lens ❀ 』── ◈
❁┊❌ حدث خطأ: ${error.message}
❁┊🔄 حاول مرة أخرى لاحقاً
◈ ──────────── ◈`);
  }
};

async function uploadToYandex(imageBuffer, debug = false) {
  try {
    if (debug) console.log("▶ Starting upload to Yandex...");
    if (debug) console.log("Image buffer size:", imageBuffer.length);
    
    const form = new FormData();
    form.append('upfile', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });

    const cookies = generateYandexCookies();
    if (debug) console.log("Generated cookies:", cookies);

    const uploadUrl = 'https://yandex.com/images/search?rpt=imageview&format=json&request=%7B%22blocks%22%3A%5B%7B%22block%22%3A%22b-page_type_search-by-image__link%22%7D%5D%7D';
    
    const headers = {
      ...form.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      'Accept-Encoding': 'gzip',
      'Cookie': cookies,
      'Referer': 'https://yandex.com',
      'X-MS-Blob-Type': 'BlockBlob'
    };

    const response = await axios.post(uploadUrl, form, {
      headers: headers,
      maxRedirects: 5
    });

    if (debug) console.log("Upload response status:", response.status);

    if (response.data && response.data.blocks) {
      if (debug) console.log("Checking blocks for URL...");
      for (const block of response.data.blocks) {
        if (block.params && block.params.url) {
          if (debug) console.log("✅ Found URL in params:", block.params.url);
          return block.params.url;
        }
      }
    }

    const responseText = JSON.stringify(response.data);
    const urlMatch = responseText.match(/avatars\.mds\.yandex\.net\/get-images-cbir\/[^"'\s]+/);
    if (urlMatch) {
      const fullUrl = 'https://' + urlMatch[0];
      if (debug) console.log("✅ Found URL via regex:", fullUrl);
      return fullUrl;
    }

    const cbirMatch = responseText.match(/"cbir_id":"([^"]+)"/);
    if (cbirMatch) {
      const cbirUrl = `https://avatars.mds.yandex.net/get-images-cbir/${cbirMatch[1]}/orig`;
      if (debug) console.log("✅ Found URL via cbir_id:", cbirUrl);
      return cbirUrl;
    }

    if (debug) console.log("❌ No URL found in response");
    return null;
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    if (error.response) {
      console.error("Error response status:", error.response.status);
    }
    return null;
  }
}

async function searchSimilarImages(imageUrl, debug = false) {
  try {
    if (debug) console.log("▶ Starting search for similar images...");
    if (debug) console.log("Image URL:", imageUrl);
    
    const cookies = generateYandexCookies();
    const searchUrl = `https://yandex.com/images/touch/search?p=0&url=${encodeURIComponent(imageUrl)}&rpt=imagelike&format=json&request=%7B%22blocks%22%3A%5B%7B%22block%22%3A%22serp-list_infinite_yes%22%2C%22params%22%3A%7B%7D%2C%22version%22%3A2%7D%5D%7D&cbir_page=similar`;
    
    if (debug) console.log("Search URL:", searchUrl);

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cookie': cookies
      }
    });

    if (debug) console.log("Search response status:", response.status);

    const results = [];

    if (response.data && response.data.blocks) {
      if (debug) console.log("Processing blocks...");
      for (const block of response.data.blocks) {
        if (debug) console.log("Block name:", block.name);
        
        if (block.html && typeof block.html === 'string') {
          if (debug) console.log("Found HTML block, extracting data...");
          
          const dataMatches = block.html.matchAll(/data-bem='({[^']+})'/g);
          
          for (const match of dataMatches) {
            try {
              const data = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
              
              if (data['serp-item']) {
                const item = data['serp-item'];
                
                if (item.img_url || item.thumb) {
                  const result = {
                    title: item.snippet?.title || '',
                    url: item.snippet?.url || '',
                    domain: item.snippet?.domain || '',
                    thumb: item.thumb?.url || null,
                    img_url: item.img_url || null
                  };
                  results.push(result);
                  if (debug && results.length <= 3) console.log("✅ Added result:", result.title || 'No title');
                }
              }
            } catch (e) {
              // تجاهل أخطاء parsing
            }
          }
        }
        
        if (block.items && Array.isArray(block.items)) {
          if (debug) console.log("Found items array, count:", block.items.length);
          for (const item of block.items) {
            if (item.img_href || item.url || item.img_url) {
              const result = {
                title: item.title || item.snippet || '',
                url: item.img_href || item.url || '',
                domain: item.domain || '',
                thumb: item.thumb?.url || null,
                img_url: item.img_url || null
              };
              results.push(result);
              if (debug && results.length <= 3) console.log("✅ Added result from items:", result.title || 'No title');
            }
          }
        }
      }
    }

    if (debug) console.log("Total results found:", results.length);

    const uniqueResults = [];
    const seenUrls = new Set();
    
    for (const result of results) {
      const imgUrl = result.img_url || result.thumb || result.url;
      if (imgUrl && !seenUrls.has(imgUrl)) {
        seenUrls.add(imgUrl);
        uniqueResults.push(result);
      }
    }
    
    if (debug) console.log("Unique results after deduplication:", uniqueResults.length);
    return uniqueResults;
  } catch (error) {
    console.error("❌ Search error:", error.message);
    if (error.response) {
      console.error("Error response status:", error.response.status);
    }
    return [];
  }
}

function generateYandexCookies() {
  const timestamp = Date.now();
  const uid = Math.floor(Math.random() * 10000000000);
  
  return `yandexuid=${uid}${timestamp}; ` +
         `gdpr=0; ` +
         `_ym_uid=${timestamp}${Math.floor(Math.random() * 1000000)}; ` +
         `_ym_d=${timestamp}`;
    }

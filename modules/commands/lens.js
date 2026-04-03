const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "lens",
  Auth: 0,
  Owner: "Fix",
  Info: "البحث عن صور مشابهة",
  Class: "صور",
  Multi: ["findimg", "reverseimg"],
  Time: 5,
  How: "lens [رد على صورة]"
};

module.exports.onPick = async function({ sh, event, api }) {
  const cacheDir = path.join(__dirname, 'cache');
  await fs.ensureDir(cacheDir);

  const files = [];
  const TARGET = 10;

  try {
    let imageUrl;

    // جلب الصورة
    if (event.type === "message_reply" && event.messageReply.attachments?.length) {
      const att = event.messageReply.attachments[0];
      if (att.type === "photo") imageUrl = att.url;
    } 
    else if (event.attachments?.length) {
      const att = event.attachments[0];
      if (att.type === "photo") imageUrl = att.url;
    }

    if (!imageUrl) {
      return sh.reply("⚠️ لازم ترد على صورة أو ترسل صورة");
    }

    const msg = await sh.reply("🔍 جاري البحث عن صور مشابهة...");

    // تحميل الصورة
    const imgRes = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    // رفع إلى Yandex
    const uploadUrl = await uploadToYandex(imgRes.data);
    if (!uploadUrl) {
      api.unsendMessage(msg.messageID);
      return sh.reply("❌ فشل رفع الصورة");
    }

    // البحث عن الصور
    const results = await searchSimilar(uploadUrl);
    if (!results.length) {
      api.unsendMessage(msg.messageID);
      return sh.reply("❌ لم يتم العثور على نتائج");
    }

    // تحميل الصور
    const streams = [];
    for (let i = 0; i < results.length && streams.length < TARGET; i++) {
      try {
        const url = results[i];
        if (!url) continue;

        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 10000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        const filePath = path.join(cacheDir, `lens_${Date.now()}_${i}.jpg`);
        await fs.writeFile(filePath, res.data);

        files.push(filePath);
        streams.push(fs.createReadStream(filePath));
      } catch {}
    }

    api.unsendMessage(msg.messageID);

    if (!streams.length) {
      return sh.reply("❌ فشل تحميل الصور");
    }

    await sh.reply({
      body: `✅ تم العثور على ${streams.length} صورة مشابهة`,
      attachment: streams
    });

    // حذف الكاش
    for (const file of files) {
      await fs.unlink(file).catch(() => {});
    }

  } catch (err) {
    for (const file of files) {
      await fs.unlink(file).catch(() => {});
    }
    return sh.reply("❌ حدث خطأ أثناء التنفيذ");
  }
};

// رفع الصورة إلى Yandex
async function uploadToYandex(buffer) {
  try {
    const form = new FormData();
    form.append("upfile", buffer, "image.jpg");

    const res = await axios.post(
      "https://yandex.com/images/search?rpt=imageview&format=json",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 15000
      }
    );

    const text = JSON.stringify(res.data);

    const match = text.match(/https:\/\/[^"]+/);
    return match ? match[0] : null;

  } catch {
    return null;
  }
}

// البحث عن الصور المشابهة
async function searchSimilar(url) {
  try {
    const res = await axios.get(
      `https://yandex.com/images/search?rpt=imagelike&url=${encodeURIComponent(url)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000
      }
    );

    const html = res.data;

    const matches = [...html.matchAll(/"url":"(.*?)"/g)];
    const images = [];

    for (const m of matches) {
      let img = m[1].replace(/\\u002F/g, "/");
      if (img.startsWith("http")) {
        images.push(img);
      }
    }

    // حذف التكرار
    return [...new Set(images)];

  } catch {
    return [];
  }
                   }

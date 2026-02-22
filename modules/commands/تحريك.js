const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'تحريك',
    version: '1.0',
    author: 'Gry KJ / تعديل سينكو',
    countDown: 10,
    prefix: true,
    description: 'حوّل صورتك إلى فيديو متحرك حسب الوصف (رد على صورة).',
    category: 'ai',
    guide: {
      ar: '{pn} [الوصف] (يجب الرد على صورة)'
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, messageReply } = event;
    const prompt = args.join(" ").trim();

    // التحقق من وجود وصف
    if (!prompt) {
      return api.sendMessage(
        "●───── ⌬ ─────●\n" +
        "┇ ⚠️ يرجى كتابة وصف للتحريك\n" +
        "┇ مثال: اجعلها أنمي\n" +
        "●───── ⌬ ─────●", 
        threadID, messageID
      );
    }

    // التحقق من الرد على صورة
    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage(
        "●───── ⌬ ─────●\n" +
        "┇ ⚠️ يرجى الرد على صورة لتحويلها\n" +
        "●───── ⌬ ─────●", 
        threadID, messageID
      );
    }

    // التفاعل بالساعة عند البدء
    api.setMessageReaction("⌚", messageID, () => {}, true);

    let statusMsg;
    try {
      statusMsg = await new Promise((resolve) => {
        api.sendMessage("●───── ⌬ ─────●\n┇ ⏳ جاري تحويل الصورة إلى فيديو...\n●───── ⌬ ─────●", threadID, (err, info) => {
          resolve(info);
        }, messageID);
      });

      const imageUrl = messageReply.attachments[0].url;
      
      // ملاحظة: هنا استخدمنا السكرابر الافتراضي من كودك السابق
      // تأكد أن مكتبة scraper معرفة عالمياً أو استدعها هنا
      let result = await scraper.glam.imgToVideo(prompt, imageUrl);

      if (Array.isArray(result) && result.length > 0 && result[0].video_url) {
        const downloadUrl = result[0].video_url;
        const cacheDir = path.join(__dirname, 'cache');
        await fs.ensureDir(cacheDir);
        const filePath = path.join(cacheDir, `animate_${Date.now()}.mp4`);

        // تحميل الفيديو المنتج
        const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(filePath, Buffer.from(videoRes.data));

        await api.sendMessage({
          body: `●───── ⌬ ─────●\n┇ ⦿ ⟬ تـم الـتـحـريـك بنجاح ✅ ⟭\n┇\n┇ 𓋰 الوصف: ${prompt}\n●───── ⌬ ─────●`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          api.setMessageReaction("✅", messageID, () => {}, true);
          fs.unlinkSync(filePath);
          api.unsendMessage(statusMsg.messageID);
        }, messageID);

      } else {
        throw new Error("No video URL found");
      }

    } catch (error) {
      console.error(error);
      api.setMessageReaction("❌", messageID, () => {}, true);
      if (statusMsg) api.unsendMessage(statusMsg.messageID);
      api.sendMessage("●───── ⌬ ─────●\n┇ ❌ فشل في معالجة الصورة\n●───── ⌬ ─────●", threadID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { fastMj } = require("../../func/api_funcs");

module.exports = {
  config: {
    name: 'توليد',
    aliases: ['fastmj', 'fmj', 'mjسريع'],
    version: '1.0.0',
    author: 'ابلين',
    countDown: 30,
    role: 0,
    description: 'توليد صور MidJourney v7 بسرعة عالية',
    category: 'ai',
    guide: { ar: '{pn} [الوصف بالإنجليزية]' }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ ميدجورني سريع v7 ⟭\n` +
        `✾ ┇ ◍ اكتب وصف الصورة بالإنجليزية\n` +
        `✾ ┇ ◍ مثال: ميدسريع futuristic city at night\n` +
        `✾ ┇ ◍ أسرع من الأمر العادي ⚡\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
      `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
      `✾ ┇ ⚡ MidJourney v7 سريع\n` +
      `✾ ┇ ◍ الوصف: ${prompt}\n` +
      `✾ ┇ ◍ جاري التوليد... ⏳\n` +
      `⏣────── ✾ ⌬ ✾ ──────⏣`,
      threadID, messageID
    );

    try {
      const result = await fastMj(prompt);

      if (!result) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل التوليد، جرب مرة أخرى`, threadID, messageID);
      }

      const imageUrls = result.imageUrls || result.images || result.data?.images || [];
      const imageUrl = result.imageUrl || result.url || (imageUrls.length > 0 ? imageUrls[0] : null);

      if (!imageUrl && imageUrls.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | لم يتم الحصول على الصورة: ${JSON.stringify(result).slice(0, 100)}`, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const urls = imageUrl ? [imageUrl] : imageUrls;
      const attachments = [];

      for (let i = 0; i < Math.min(urls.length, 4); i++) {
        try {
          const imgResponse = await axios.get(urls[i], { responseType: 'arraybuffer', timeout: 30000 });
          const imgPath = path.join(cacheDir, `fmj_${Date.now()}_${i}.jpg`);
          fs.writeFileSync(imgPath, imgResponse.data);
          attachments.push(fs.createReadStream(imgPath));
        } catch (e) {}
      }

      if (attachments.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل تحميل الصورة`, threadID, messageID);
      }

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تم التوليد!\n✾ ┇ ◍ ${attachments.length} صورة\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: attachments
      }, threadID, () => {
        attachments.forEach(s => { try { fs.unlinkSync(s.path); } catch (e) {} });
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ | خطأ: ${error.message}`, threadID, messageID);
    }
  }
};

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { nsfw } = require("../../func/api_funcs");

module.exports = {
  config: {
    name: 'نسف',
    aliases: ['nsfw', 'r18'],
    version: '1.0.0',
    author: 'ابلين',
    countDown: 20,
    role: 2,
    description: 'توليد صور NSFW بالذكاء الاصطناعي (للمشرفين فقط)',
    category: 'ai',
    guide: { ar: '{pn} [1|2] [الوصف] | 1=أنمي 2=واقعي' }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ مولد NSFW ⟭\n` +
        `✾ ┇ ◍ نسف 1 [وصف] → أنمي\n` +
        `✾ ┇ ◍ نسف 2 [وصف] → واقعي\n` +
        `✾ ┇ ◍ مثال: نسف 1 anime girl beach\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    const model = args[0];
    const prompt = args.slice(1).join(" ").trim();

    if (!prompt) {
      return api.sendMessage(`⚠️ | اكتب وصف الصورة بعد رقم الموديل`, threadID, messageID);
    }

    if (model !== "1" && model !== "2") {
      return api.sendMessage(`❌ | الموديل يجب أن يكون 1 (أنمي) أو 2 (واقعي)`, threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(`🎨 | جاري التوليد... الموديل: ${model === "1" ? "أنمي" : "واقعي"}`, threadID, messageID);

    try {
      const imageUrls = await nsfw(prompt, parseInt(model));

      if (!imageUrls || imageUrls.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل التوليد`, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const attachments = [];
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const imgResponse = await axios.get(imageUrls[i], { responseType: 'arraybuffer', timeout: 30000 });
          const imgPath = path.join(cacheDir, `nsfw_${Date.now()}_${i}.jpg`);
          fs.writeFileSync(imgPath, imgResponse.data);
          attachments.push(fs.createReadStream(imgPath));
        } catch (e) {}
      }

      if (attachments.length === 0) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل تحميل الصورة`, threadID, messageID);
      }

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تم التوليد!\n✾ ┇ ◍ الموديل: ${model === "1" ? "أنمي" : "واقعي"}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
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

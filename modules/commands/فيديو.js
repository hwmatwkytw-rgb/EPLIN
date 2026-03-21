const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { upscaleVid } = require("../../func/api_funcs");

module.exports = {
  config: {
    name: 'فيديو',
    aliases: ['upscale', 'رفع', 'upscalevid'],
    version: '1.0.0',
    author: 'ابلين',
    countDown: 120,
    role: 0,
    description: 'تحسين جودة الفيديو إلى 1080p بالذكاء الاصطناعي',
    category: 'ai',
    guide: { ar: '{pn} (رد على فيديو)' }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    const videoAttachment = messageReply?.attachments?.find(a => a.type === "video");
    if (!videoAttachment) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ رفع جودة الفيديو ⟭\n` +
        `✾ ┇ ◍ رد على رسالة فيديو بـ: رفع_فيديو\n` +
        `✾ ┇ ◍ يرفع الجودة إلى 1080p 🎬\n` +
        `✾ ┇ ◍ قد يستغرق 2-5 دقائق ⏱️\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    const videoUrl = videoAttachment.url;

    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
      `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
      `✾ ┇ ⏣ ⟬ رفع جودة الفيديو ⟭\n` +
      `✾ ┇ ◍ الحالة: جاري الرفع إلى 1080p...\n` +
      `✾ ┇ ◍ ⚠️ العملية تستغرق 2-5 دقائق\n` +
      `✾ ┇ ◍ لا تتعجل، ابلين شغالة 😸\n` +
      `⏣────── ✾ ⌬ ✾ ──────⏣`,
      threadID, messageID
    );

    try {
      const outputUrl = await upscaleVid(videoUrl);

      if (!outputUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل رفع جودة الفيديو`, threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const vidPath = path.join(cacheDir, `upscaled_${Date.now()}.mp4`);

      const vidResponse = await axios.get(outputUrl, { responseType: 'arraybuffer', timeout: 120000 });
      fs.writeFileSync(vidPath, vidResponse.data);

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تم رفع جودة الفيديو!\n✾ ┇ ◍ الجودة الجديدة: 1080p\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: fs.createReadStream(vidPath)
      }, threadID, () => {
        try { fs.unlinkSync(vidPath); } catch (e) {}
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ | خطأ: ${error.message}`, threadID, messageID);
    }
  }
};

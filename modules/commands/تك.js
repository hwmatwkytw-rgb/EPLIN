const axios = require('axios');

module.exports = {
  config: {
    name: 'تيك',
    version: '1.0',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    category: 'media',
    description: 'تحميل فيديوهات تيك توك بدون علامة مائية',
    guide: { ar: '{pn} [رابط الفيديو]' }
  },

  onStart: async ({ api, event, args }) => {
    const link = args[0];
    if (!link) return api.sendMessage("✾ ┇ أرسل رابط الفيديو الذي تريد تحميله", event.threadID);

    api.sendMessage("✾ ┇ جاري سحب الفيديو من تيك توك... 📥🥱", event.threadID);

    try {
      const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(link)}`);
      const videoUrl = res.data.video.noWatermark;

      api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تـم الـتـحـمـيـل بـنـجـاح\n✾ ┇ ◍ الـمـصدر: TikTok\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: await axios.get(videoUrl, { responseType: 'stream' }).then(r => r.data)
      }, event.threadID);
    } catch (e) { api.sendMessage("⏣ ❌ الرابط غير صحيح أو السيرفر مضغوط", event.threadID); }
  }
};

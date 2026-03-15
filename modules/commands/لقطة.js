const axios = require('axios');

module.exports = {
  config: {
    name: 'لقطة',
    version: '1.0',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'أخذ لقطة شاشة لموقع الكتروني',
    guide: { ar: '{pn} [رابط الموقع]' }
  },

  onStart: async ({ api, event, args }) => {
    const url = args[0];
    if (!url) return api.sendMessage("✾ ┇ أرسل رابط الموقع الذي تريد تصويره", event.threadID);

    api.sendMessage("✾ ┇ جاري تصوير الموقع... انتظر 📸", event.threadID);

    try {
      const ssUrl = `https://image.thum.io/get/width/1200/crop/800/fullpage/${url}`;
      const response = await axios.get(ssUrl, { responseType: 'stream' });

      api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ لـقـطـة الـشـاشـة جـاهـزة\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: response.data
      }, event.threadID);
    } catch (e) { api.sendMessage("⏣ ❌ تعذر الوصول للموقع", event.threadID); }
  }
};

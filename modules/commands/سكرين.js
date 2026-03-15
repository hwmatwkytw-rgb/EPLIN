const axios = require('axios');

module.exports = {
  config: {
    name: 'سكرين',
    version: '1.0',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تصوير شاشة أي موقع عبر الرابط'
  },

  onStart: async ({ api, event, args }) => {
    const url = args[0];
    if (!url) return api.sendMessage("✾ ┇ أرسل رابط الموقع لتصويره", event.threadID);

    api.sendMessage("✾ ┇ جاري الدخول للموقع وتصوير الشاشة... 📸", event.threadID);

    try {
      const shotUrl = `https://api.paxsenix.biz.id/tools/screenshot?url=${encodeURIComponent(url)}`;
      
      api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ لـقـطـة شـاشـة لـلـموقـع\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: await axios.get(shotUrl, { responseType: 'stream' }).then(r => r.data)
      }, event.threadID);
    } catch (e) { api.sendMessage("⏣ ❌ فشل تصوير الموقع", event.threadID); }
  }
};

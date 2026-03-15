const axios = require('axios');

module.exports = {
  config: {
    name: 'انمي',
    version: '1.0',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'البحث عن معلومات أي أنمي',
    guide: { ar: '{pn} [اسم الانمي]' }
  },

  onStart: async ({ api, event, args }) => {
    const query = args.join(" ");
    if (!query) return api.sendMessage("✾ ┇ أكتب اسم الأنمي للبحث عنه", event.threadID);

    try {
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
      const data = res.data.data[0];

      if (!data) return api.sendMessage("⏣ ❌ لم يتم العثور على هذا الأنمي", event.threadID);

      const msg = 
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇
✾ ┇ ⏣ ⟬ مـعـلـومـات الأنـمـي ⟭
✾ ┇ ◍ الإسـم: ${data.title_english || data.title}
✾ ┇ ◍ الـتقييم: ⭐ ${data.score || 'N/A'}
✾ ┇ ◍ الـحلقات: 📺 ${data.episodes || '؟'}
✾ ┇ ◍ الـحالة: ${data.status}
✾ ┇ ◍ الـموسم: ${data.season || 'غير معروف'}
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◍ الـقصة: ${data.synopsis ? data.synopsis.slice(0, 200) + '...' : 'لا يوجد'}
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣`;

      api.sendMessage({ body: msg, attachment: await axios.get(data.images.jpg.image_url, { responseType: 'stream' }).then(r => r.data) }, event.threadID);
    } catch (e) { api.sendMessage("⏣ ❌ حدث خطأ في البحث", event.threadID); }
  }
};

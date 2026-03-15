const axios = require('axios');

module.exports = {
  config: {
    name: 'ويكيدا',
    version: '1.0',
    author: 'سينكو',
    countDown: 3,
    prefix: true,
    category: 'أدوات',
    description: 'البحث في ويكيبيديا العربية',
    guide: { ar: '{pn} [كلمة البحث]' }
  },

  onStart: async ({ api, event, args }) => {
    const query = args.join(" ");
    if (!query) return api.sendMessage("✾ ┇ ماذا تريد أن تبحث عنه في ويكيبيديا؟", event.threadID);

    try {
      const res = await axios.get(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      
      const msg = 
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇
✾ ┇ ⏣ ⟬ مـوسـوعـة ويـكـيـبـيـديـا ⟭
✾ ┇ ◍ الـموضوع: ${res.data.title}
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◍ الـخلاصة: ${res.data.extract}
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣`;

      api.sendMessage(msg, event.threadID);
    } catch (e) { api.sendMessage("⏣ ❌ لم أجد نتائج لهذا الموضوع", event.threadID); }
  }
};

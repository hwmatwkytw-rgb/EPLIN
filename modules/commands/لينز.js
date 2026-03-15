const axios = require('axios');

module.exports = {
  config: {
    name: 'لينز',
    version: '1.0',
    author: 'سينكو',
    countDown: 10,
    prefix: true,
    category: 'أدوات',
    description: 'البحث عن مصدر الصورة (رد على صورة)'
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageReply, messageID } = event;
    if (!messageReply || !messageReply.attachments[0]) return api.sendMessage("✾ ┇ رد على صورة لأبحث لك عن مصدرها", threadID);

    api.sendMessage("✾ ┇ جاري البحث   ... 🔍", threadID);

    try {
      const imgUrl = encodeURIComponent(messageReply.attachments[0].url);
      const res = await axios.get(`https://api.paxsenix.biz.id/tools/google-reverse?url=${imgUrl}`);
      const result = res.data[0];

      api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تـم الـعـثـور عـلـى الـمـصـدر\n✾ ┇ ◍ الـعـنوان: ${result.title}\n✾ ┇ ◍ الـرابط: ${result.link}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: await axios.get(result.image, { responseType: 'stream' }).then(r => r.data)
      }, threadID, messageID);
    } catch (e) { api.sendMessage("⏣ ❌ لم أستطع العثور على مصدر لهذه الصورة", threadID); }
  }
};

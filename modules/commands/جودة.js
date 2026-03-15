const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'جودة',
    version: '1.0',
    author: 'سينكو',
    countDown: 10,
    prefix: true,
    category: 'ai',
    description: 'رفع جودة الصور الضعيفة (رد على صورة)',
    guide: { ar: '{pn} (رد على صورة)' }
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;
    if (!messageReply || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("✾ ┇ يرجى الرد على صورة لتحسين جودتها", threadID, messageID);
    }

    api.sendMessage("✾ ┇ جاري معالجة الصورة ورفع الجودة... 🛠️", threadID, messageID);

    try {
      const imgUrl = encodeURIComponent(messageReply.attachments[0].url);
      const resUrl = `https://api.paxsenix.biz.id/ai/upscale?url=${imgUrl}`;
      
      const response = await axios.get(resUrl, { responseType: 'stream' });
      
      api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تـم تـحـسـيـن الـجـودة بـنـجـاح\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: response.data
      }, threadID, messageID);
    } catch (e) { api.sendMessage("⏣ ❌ فشل النظام في معالجة الصورة", threadID, messageID); }
  }
};

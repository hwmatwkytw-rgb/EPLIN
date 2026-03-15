const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'تخيل',
    version: '1.0',
    author: 'سينكو',
    countDown: 10,
    prefix: true,
    category: 'ai',
    description: 'تحويل النص إلى صورة بالذكاء الاصطناعي',
    guide: { ar: '{pn} [وصف الصورة بالانجليزي]' }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) return api.sendMessage("✾ ┇ أكتب وصفاً للصورة التي تريدها (بالانجليزية) 🎨", threadID, messageID);

    api.sendMessage("✾ ┇ جاري رسم خيالك... انتظر قليلاً 🪄", threadID, messageID);

    try {
      const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
      const imagePath = path.join(__dirname, 'cache', `imagine_${Date.now()}.png`);
      
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      await fs.outputFile(imagePath, Buffer.from(response.data));

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تـم تـولـيـد الـصـورة بـنـجـاح\n✾ ┇ ◍ الـوصف: ${prompt}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath), messageID);

    } catch (e) {
      api.sendMessage("⏣ ❌ فشل في توليد الصورة، جرب لاحقاً", threadID, messageID);
    }
  }
};

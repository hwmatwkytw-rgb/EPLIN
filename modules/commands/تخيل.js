const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const DEVELOPER_ID = '100081948980908'; // إيديك كمطور

module.exports = {
  config: {
    name: 'تخيل',
    version: '1.0',
    author: 'Hridoy / Modified',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'أمر تخيل يولد صور بالذكاء الاصطناعي.',
    category: 'fun',
    guide: {
      ar: '{pn} تخيل [وصف الصورة]',
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const prompt = args.join(' ');

      if (!prompt) {
        return api.sendMessage(
          '❌ اكتب ماذا تريد أن تتخيل.\nمثال: تخيل تنين ناري في السماء',
          event.threadID
        );
      }

      api.sendMessage('⏳ جاري توليد الصورة...', event.threadID);

      // رابط API توليد الصور
      const imageUrl = `https://api.popcat.xyz/ai-image?prompt=${encodeURIComponent(prompt)}`;

      const imgPath = path.join(__dirname, 'cache', `imagine_${Date.now()}.png`);

      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
      });

      await fs.ensureDir(path.dirname(imgPath));

      const writer = fs.createWriteStream(imgPath);
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.sendMessage(
          {
            body: `✨ تخيل:\n${prompt}`,
            attachment: fs.createReadStream(imgPath)
          },
          event.threadID,
          () => fs.unlinkSync(imgPath)
        );
      });

      writer.on('error', (err) => {
        console.error(err);
        api.sendMessage('❌ حدث خطأ أثناء حفظ الصورة.', event.threadID);
      });

    } catch (error) {
      console.error("Error in imagine command:", error);
      api.sendMessage('❌ حدث خطأ أثناء تنفيذ أمر التخيل.', event.threadID);
    }
  },
};

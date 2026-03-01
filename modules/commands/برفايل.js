const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'برفايل', // اسم الأمر الجديد بالعربي
    version: '1.0',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    description: 'يعرض صورة ملفك الشخصي أو صورة المستخدم المحدد.',
    category: 'fun',
    guide: {
      ar: '   {pn} [@الإشارة (اختياري)]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const mentions = event.mentions;
      let uid = event.senderID;
      let targetName = 'المستخدم';

      // إذا تم الإشارة لشخص آخر
      if (args.length > 0 && mentions && Object.keys(mentions).length > 0) {
        uid = Object.keys(mentions)[0];
        targetName = mentions[uid].replace(/@/g, '');
      } else {
        // الحصول على معلومات المستخدم الحالي
        const info = await new Promise(resolve =>
          api.getUserInfo(uid, (err, res) => resolve(res || {}))
        );
        targetName = info[uid]?.name || 'المستخدم';
      }

      // رابط الصورة من فيسبوك
      const profilePicUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const tempPath = path.join(__dirname, `../../temp/avatar_${uid}.png`);
      await fs.ensureDir(path.dirname(tempPath));

      const response = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(tempPath, response.data);

      // إرسال الصورة
      await api.sendMessage(
        {
          body: `🖼️ هذه صورة ملف ${targetName} الشخصي`,
          attachment: fs.createReadStream(tempPath),
        },
        event.threadID
      );

      await fs.unlink(tempPath); // حذف الصورة المؤقتة
    } catch (error) {
      console.error('خطأ في أمر برفايل:', error);
      api.sendMessage('❌ لم أتمكن من جلب صورة الملف الشخصي.', event.threadID);
    }
  }
};

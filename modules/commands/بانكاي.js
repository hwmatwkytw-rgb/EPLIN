const axios = require('axios');

module.exports = {
  config: {
    name: 'بانكاي',
    version: '1.3',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'يقوم بطرد عضو من المجموعة مع تفاعل ساخر (محمي ضد طرد البوت).',
    category: 'group',
    guide: {
      ar: '{pn} @منشن | UID | بالرد على رسالة'
    },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const botID = api.getCurrentUserID(); // الحصول على ID البوت

    // إضافة التفاعل الساخر 
    api.setMessageReaction("🦆", messageID, (err) => {}, true);

    try {
      let targetID = null;

      // 1️⃣ تحديد الهدف
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (args[0]) {
        targetID = args[0];
      }

      // لو ما في أي هدف
      if (!targetID) {
        return api.sendMessage(
          'هات رد منشنن.',
          threadID,
          messageID
        );
      }

      // 🛡️ الحماية: التأكد أن الهدف ليس البوت نفسه
      if (targetID == botID) {
        return api.sendMessage(
          'قاعده في بيتكم؟ ',
          threadID,
          messageID
        );
      }

      // رابط الصورة
      const imageUrl = 'https://i.ibb.co/wZDHSMvM/received-897009799489398.jpg';

      // تحميل الصورة
      const img = await axios.get(imageUrl, { responseType: 'stream' });

      // إرسال التحذير مع الصورة
      await api.sendMessage(
        {
          body: '🌚!\n كان رقاصة ...',
          attachment: img.data
        },
        threadID
      );

      // طرد المستخدم
      api.removeUserFromGroup(targetID, threadID, (err) => {
        if (err) {
          console.error(err);
          return api.sendMessage(
            '❌ فشل الطرد، تأكد أن البوت مشرف.',
            threadID
          );
        }

        api.sendMessage(
          `هنفتقدو 🦆.`,
          threadID
        );
      });

    } catch (err) {
      console.error('خطأ أمر بانكاي:', err);
      api.sendMessage(
        '❌ حدث خطأ غير متوقع.',
        threadID,
        messageID
      );
    }
  }
};

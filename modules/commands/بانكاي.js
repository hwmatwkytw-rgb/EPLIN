const axios = require('axios');

module.exports = {
  config: {
    name: 'بانكاي',
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'يقوم بطرد عضو من المجموعة مع تفاعل ساخر.',
    category: 'group',
    guide: {
      ar: '{pn} @منشن | UID | بالرد على رسالة'
    },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    // إضافة التفاعل الساخر 😆 على رسالة الشخص الذي نفذ الأمر
    api.setMessageReaction("😆", messageID, (err) => {}, true);

    try {
      let targetID = null;

      // 1️⃣ لو في منشن
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      }

      // 2️⃣ لو الأمر بالرد على رسالة
      else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      }

      // 3️⃣ لو كتب UID مباشر
      else if (args[0]) {
        targetID = args[0];
      }

      // لو ما في أي هدف
      if (!targetID) {
        return api.sendMessage(
          '❌ استخدم الأمر مع منشن أو UID أو بالرد على رسالة.',
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
          body: '⚠️ بانكاي مفعل!\nسيتم طرد العضو الآن...',
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

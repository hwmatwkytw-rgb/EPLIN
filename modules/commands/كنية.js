module.exports = {
  config: {
    name: 'كنية',
    version: '2.0',
    author: 'Hridoy + Fix',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true,
    description: 'تعيين أو حذف كنية (بالرد، المنشن، أو على نفسك)',
    category: 'group',
    guide: {
      ar: '{pn} [بالرد | @منشن] [كنية جديدة]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let targetID = null;
      let newNickname = '';
      const botID = api.getCurrentUserID();

      // ✅ 1️⃣ لو في رد
      if (event.type === "message_reply" && event.messageReply) {
        targetID = event.messageReply.senderID;
        newNickname = args.join(' ');
      }

      // ✅ 2️⃣ لو في منشن
      else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
        newNickname = args.slice(1).join(' ');
      }

      // ✅ 3️⃣ بدون رد ولا منشن → على نفسو
      else {
        targetID = event.senderID;
        newNickname = args.join(' ');
      }

      // 🔁 لو المنشن كان البوت → امسح كنية الكاتب
      if (targetID === botID) {
        targetID = event.senderID;
        newNickname = '';
      }

      // ⚡ تغيير الكنية
      api.changeNickname(newNickname, event.threadID, targetID, (err) => {
        if (err) {
          console.error(err);
          return api.sendMessage(
            'عايزه ادمن  😺.',
            event.threadID
          );
        }

        api.sendMessage(
          newNickname
            ? ''
            : '',
          event.threadID
        );
      });

    } catch (error) {
      console.error(error);
      api.sendMessage(
        '⚠️ حصل خطأ أثناء تنفيذ الأمر.',
        event.threadID
      );
    }
  },
};

module.exports = {
  config: {
    name: 'كنية',
    version: '2.5',
    author: 'Hridoy + Fix',
    countDown: 5,
    prefix: true,
    groupAdminOnly: true, // متاح فقط للمسؤولين كما طلبت
    description: 'تعيين أو حذف كنية مع تفاعلات تلقائية',
    category: 'group',
    guide: {
      ar: '{pn} [بالرد | @منشن] [كنية جديدة]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID, senderID, messageReply, mentions, type } = event;
      const botID = api.getCurrentUserID();
      let targetID = null;
      let newNickname = "";

      // 1️⃣ تحديد المستهدف واستخلاص الكنية الجديدة
      if (type === "message_reply") {
        targetID = messageReply.senderID;
        newNickname = args.join(" ");
      } 
      else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        // إزالة اسم المنشن من النص المكتوب للحصول على الكنية فقط
        const mentionName = mentions[targetID];
        newNickname = args.join(" ").replace(mentionName, "").trim();
      } 
      else {
        targetID = senderID;
        newNickname = args.join(" ");
      }

      // حماية: لو المنشن للبوت، نطبق الأمر على المرسل
      if (targetID === botID) targetID = senderID;

      // 2️⃣ تنفيذ تغيير الكنية
      api.changeNickname(newNickname, threadID, targetID, (err) => {
        if (err) {
          console.error(err);
          return api.sendMessage('❌ محتاج صلاحيات أدمن لتغيير الكنية.', threadID, messageID);
        }

        // 3️⃣ ميزة التفاعل الذكي
        if (!newNickname || newNickname.trim() === "") {
          // لو كتب كنية "ساي" (بدون اسم جديد) -> تفاعل بسلة الزبالة
          api.setMessageReaction("🗑️", messageID, () => {}, true);
        } else {
          // لو كتب كنية مع اسم جديد -> تفاعل بصح
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      });

    } catch (error) {
      console.error(error);
      api.sendMessage('⚠️ حصل خطأ أثناء تنفيذ الأمر.', event.threadID);
    }
  },
};

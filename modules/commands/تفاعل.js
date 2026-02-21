module.exports = {
  config: {
    name: 'تفاعل',
    version: '1.6',
    author: 'Gemini + Fix',
    countDown: 0,
    prefix: false,
    description: 'تفعيل نظام حذف الرسائل بالتفاعل (للمطور فقط)',
    category: 'owner',
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572";

    if (senderID !== developerID) {
      return api.sendMessage("🚫 هذا الأمر خاص بالمطور فقط.", threadID, messageID);
    }

    // تأكيد أن النظام نشط
    return api.setMessageReaction("🖤", messageID, (err) => {}, true);
  },

  onReaction: async ({ api, event }) => {
    const { reaction, userID, messageID } = event;
    const developerID = "61588108307572";
    const targetEmoji = "🗑️";

    // التحقق: هل الشخص هو المطور وهل الإيموجي هو المطلوب؟
    if (userID === developerID && reaction === targetEmoji) {
      return api.unsendMessage(messageID, (err) => {
        if (err) {
          console.error("تعذر حذف الرسالة:", err);
        }
      });
    }
  }
};

module.exports = {
  config: {
    name: 'تفاعل',
    version: '1.5',
    author: 'Gemini + Fix',
    countDown: 0,
    prefix: false,
    description: 'تفعيل نظام حذف الرسائل بالتفاعل (للمطور فقط)',
    category: 'المطور',
  },

  // الجزء الخاص بتأكيد تشغيل الأمر عند كتابة كلمة "تفاعل"
  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572"; // معرف حسابك

    // التحقق من المطور
    if (senderID !== developerID) {
      return api.sendMessage("🚫 هذا الأمر خاص بالمطور فقط.", threadID, messageID);
    }

    // التفاعل بقلب أسود للتأكيد
    return api.setMessageReaction("🖤", messageID, (err) => {}, true);
  },

  // الجزء المسؤول عن مراقبة التفاعلات وحذف الرسائل
  onReaction: async ({ api, event }) => {
    try {
      const { reaction, userID, messageID, threadID } = event;
      const developerID = "61588108307572"; // معرف حسابك (المطور)
      const targetEmoji = "🦧";

      // التحقق من الإيموجي وأن المتفاعل هو المطور حصراً
      if (reaction === targetEmoji && userID === developerID) {
        return api.unsendMessage(messageID);
      }
    } catch (e) {
      console.error("خطأ في حذف الرسالة بالتفاعل:", e);
    }
  }
};

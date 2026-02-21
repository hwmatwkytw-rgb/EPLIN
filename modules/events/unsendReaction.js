module.exports = {
  config: {
    name: 'unsendReaction',
    eventType: ['reaction_updated'],
    version: '1.1.0',
    author: 'Gemini',
    description: 'حذف الرسائل عند تفاعل المطور بإيموجي 🗑️'
  },

  run: async ({ api, event }) => {
    const { reaction, userID, messageID, threadID } = event;
    const developerID = "61588108307572"; // الـ ID الخاص بك
    const targetEmoji = "🗑️";

    // التحقق من الهوية والإيموجي
    if (userID === developerID && reaction === targetEmoji) {
      
      // محاولة حذف الرسالة
      api.unsendMessage(messageID, (err) => {
        if (err) {
          // إذا ظهر هذا الخطأ في الكونسول، فالبوت ليس أدمن
          console.error("❌ لم أستطع حذف الرسالة. تأكد أنني أدمن في المجموعة.");
          
          // اختياري: البوت يرسل لك رسالة خاصة أو تنبيه (يفضل عدم تفعيلها لعدم الإزعاج)
          // api.sendMessage("فشلت في حذف الرسالة، ارفعني أدمن أولاً.", threadID);
        }
      });
    }
  }
};

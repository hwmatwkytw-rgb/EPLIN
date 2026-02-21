module.exports = {
  config: {
    name: 'unsendReaction',
    eventType: ['log:subscribe', 'reaction'], // إضافة reaction بشكل مباشر
    version: '1.2.0',
    author: 'Gemini',
    description: 'حذف الرسائل عند تفاعل المطور بإيموجي 🗑️'
  },

  run: async ({ api, event }) => {
    // التحقق من أن الحدث هو تفاعل (Reaction)
    if (event.type === "reaction") {
      const { reaction, userID, messageID } = event;
      const developerID = "61588108307572"; 
      const targetEmoji = "🗑️";

      if (userID === developerID && reaction === targetEmoji) {
        api.unsendMessage(messageID, (err) => {
          if (err) {
            console.error("❌ فشل الحذف: تأكد من صلاحيات الأدمن.");
          }
        });
      }
    }
  }
};

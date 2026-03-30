const fs = require('fs-extra');

const DEVELOPER_ID = '100081948980908'; // إيديك كمطور

module.exports = {
  config: {
    name: 'تخيل',
    version: '1.0',
    author: 'Hridoy / Modified',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'أمر تخيل يولد سيناريو خيالي بناءً على طلب المستخدم.',
    category: 'fun',
    guide: {
      ar: '{pn} تخيل [وصف الخيال]',
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      const prompt = args.join(' ');

      if (!prompt) {
        return api.sendMessage(
          '❌ اكتب ماذا تريد أن تتخيل.\nمثال: تخيل مدينة طائرة فوق البحر',
          event.threadID
        );
      }

      // إنشاء نص تخيلي بسيط
      const stories = [
        `في عالم موازٍ، ${prompt} حدث بطريقة لا تصدق، حيث انقلبت قوانين الطبيعة بالكامل.`,
        `تخيل أنك داخل حلم... ${prompt} أصبح حقيقة، والجميع ينظر بدهشة.`,
        `في سنة 3000، ${prompt} كان جزءًا من الحياة اليومية في مدينة عائمة في السماء.`,
        `في لحظة غريبة، ${prompt} فتح بوابة لعالم مليء بالمخلوقات الأسطورية.`,
      ];

      const result = stories[Math.floor(Math.random() * stories.length)];

      // إرسال النتيجة
      api.sendMessage(`✨ تخيل:\n\n${result}`, event.threadID);

    } catch (error) {
      console.error("Error in imagine command:", error);
      api.sendMessage('حدث خطأ أثناء تنفيذ أمر التخيل.', event.threadID);
    }
  },
};

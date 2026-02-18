const fs = require('fs');

module.exports = {
  config: {
    name: 'رستارت',
    version: '1.2',
    author: 'Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    description: 'إعادة تشغيل البوت وعرض رسالة عند إعادة التشغيل.',
    category: 'admin',
    guide: {
      en: '{pn}'
    },
  },

  onStart: async ({ message, event, api }) => {
    try {
      const restartInfo = {
        startTime: Date.now(),
        threadID: event.threadID
      };
      
      // حفظ بيانات الجلسة الحالية
      fs.writeFileSync('./restart.json', JSON.stringify(restartInfo));

      // التفاعل مع رسالة المطلب بالإيموجي المطلوب
      await api.setMessageReaction("🔂", event.messageID, () => {}, true);

      // تأخير بسيط للتأكد من وصول التفاعل قبل الخروج
      setTimeout(() => {
        process.exit(2);
      }, 1000);

    } catch (error) {
      console.log(error);
    }
  },

  onLoad: async ({ api }) => {
    // التحقق من وجود ملف بيانات إعادة التشغيل
    if (fs.existsSync('./restart.json')) {
      try {
        const data = JSON.parse(fs.readFileSync('./restart.json', 'utf8'));
        const { threadID } = data;

        // إرسال رسالة النجاح بعد العودة للعمل
        await api.sendMessage('ابلين رستارت دن 🌼✅', threadID);

        // تنظيف الملف
        fs.unlinkSync('./restart.json');
      } catch (err) {
        console.error('خطأ عند إرسال رسالة إعادة التشغيل:', err);
      }
    }
  }
};

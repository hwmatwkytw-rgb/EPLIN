const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "اعدادات",
    version: "2.5",
    author: "سينكو & Gemini",
    countDown: 5,
    description: "إعدادات حماية المجموعة بنمط هندسي",
    category: "group",
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, messageID, senderID } = event;
      if (!event.isGroup) return api.sendMessage('❌ هذا الأمر متاح للمجموعات فقط.', threadID);

      let threadData = Threads.get(threadID) || {};
      if (!threadData.settings) threadData.settings = {};
      if (!threadData.settings.anti) {
        threadData.settings.anti = {
          antiSpam: false,
          antiOut: false,
          antiName: false,
          antiIcon: false,
          antiNickname: false
        };
      }

      const anti = threadData.settings.anti;
      const statusIcon = (bool) => bool ? "✅" : "❌";

      let msg = `◈ ─── إعدادات الحماية ─── ◈\n\n`;
      msg += `① ⠐ مكافحة السبام\n   ⭓ 『 ${statusIcon(anti.antiSpam)} 』\n\n`;
      msg += `② ⠐ منع الخروج\n   ⭓ 『 ${statusIcon(anti.antiOut)} 』\n\n`;
      msg += `③ ⠐ قفل اسم المجموعة\n   ⭓ 『 ${statusIcon(anti.antiName)} 』\n\n`;
      msg += `④ ⠐ قفل صورة المجموعة\n   ⭓ 『 ${statusIcon(anti.antiIcon)} 』\n\n`;
      msg += `⑤ ⠐ منع تغيير الكنيات\n   ⭓ 『 ${statusIcon(anti.antiNickname)} 』\n\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `│← رد على الرسالة برقم الخيار\n`;
      msg += `│← الـحـالـة: جاهز للضبط 𓋹`;

      return api.sendMessage(msg, threadID, (err, info) => {
        if (err) return console.error(err);
        
        // التأكد من وجود المصفوفة قبل الدفع فيها
        if (!global.client.handleReply) global.client.handleReply = [];
        
        global.client.handleReply.push({
          name: "اعدادات", // تأكد أن الاسم يطابق config.name
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ داخلي في عرض الإعدادات.', event.threadID);
    }
  },

  handleReply: async ({ api, event, handleReply }) => {
    const { threadID, messageID, body, senderID } = event;

    // منع أي شخص غير اللي طلب الأمر من التحكم
    if (senderID !== handleReply.author) return;

    const choice = parseInt(body);
    const keys = ["antiSpam", "antiOut", "antiName", "antiIcon", "antiNickname"];
    
    if (isNaN(choice) || choice < 1 || choice > keys.length) return;

    try {
      let threadData = Threads.get(threadID);
      const key = keys[choice - 1];
      
      // تبديل الحالة
      threadData.settings.anti[key] = !threadData.settings.anti[key];
      
      // حفظ البيانات
      Threads.set(threadID, threadData);

      const status = threadData.settings.anti[key] ? "✅" : "❌";
      
      // حذف الرسالة القديمة عشان الزحمة
      api.unsendMessage(handleReply.messageID); 
      
      return api.sendMessage(`✅ تم تحديث الخيار رقم (${choice}) إلى 『 ${status} 』 بنجاح!`, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ فشل في حفظ الإعدادات، تأكد من ملف الداتابيز.", threadID);
    }
  }
};

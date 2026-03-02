const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "اعدادات",
    version: "1.1",
    author: "سينكو",
    countDown: 5,
    description: "إعدادات حماية المجموعة بنمط هندسي",
    category: "group",
  },

  onStart: async ({ api, event, args }) => {
    try {
      const { threadID, messageID } = event;
      if (!event.isGroup) return api.sendMessage('❌ هذا الأمر متاح للمجموعات فقط.', threadID);

      const threadData = Threads.get(threadID) || {};
      threadData.settings = threadData.settings || {};
      
      // تحديث كائن الحماية ليشمل ميزة الألقاب
      threadData.settings.anti = threadData.settings.anti || {
        antiSpam: false,
        antiOut: false,
        antiName: false,
        antiIcon: false,
        antiNickname: false // الميزة الجديدة
      };

      const anti = threadData.settings.anti;

      // --- حالة التعديل ---
      if (args[0] === 'تغيير') {
        const choice = args[1];
        if (!choice || isNaN(choice)) return api.sendMessage('⚠️ يرجى كتابة رقم الخيار بعد كلمة تغيير (مثال: اعدادات تغيير 5)', threadID);

        // إضافة antiNickname للمصفوفة للتحكم بها عبر الرقم 5
        const keys = ["antiSpam", "antiOut", "antiName", "antiIcon", "antiNickname"];
        const index = parseInt(choice) - 1;

        if (index >= 0 && index < keys.length) {
          const key = keys[index];
          anti[key] = !anti[key]; // تبديل الحالة (True/False)
          Threads.set(threadID, threadData);

          return api.sendMessage(`✅ تم تحديث الخيار رقم (${choice}) بنجاح!`, threadID);
        } else {
          return api.sendMessage('❌ رقم خيار غير صحيح.', threadID);
        }
      }

      // --- عرض القائمة (النمط الهندسي الحاد) ---
      const status = (bool) => bool ? "✅ مـفـعـل" : "❌ مـعـطل";

      let msg = `◈ ─── إعدادات الحماية ─── ◈\n\n`;
      msg += `① ⠐ مكافحة السبام\n   ⭓ 『 ${status(anti.antiSpam)} 』\n\n`;
      msg += `② ⠐ منع الخروج\n   ⭓ 『 ${status(anti.antiOut)} 』\n\n`;
      msg += `③ ⠐ قفل اسم المجموعة\n   ⭓ 『 ${status(anti.antiName)} 』\n\n`;
      msg += `④ ⠐ قفل صورة المجموعة\n   ⭓ 『 ${status(anti.antiIcon)} 』\n\n`;
      msg += `⑤ ⠐ قفل الألقاب (الكنية)\n   ⭓ 『 ${status(anti.antiNickname)} 』\n\n`; // عرض الميزة في القائمة
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `│← للتغيير: اعدادات تغيير <الرقم>\n`;
      msg += `│← الـحـالـة: جاهز للضبط 𓋹`;

      api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ داخلي.', event.threadID);
    }
  }
};

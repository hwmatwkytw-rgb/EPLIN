const { Users } = require('../../database/database');

// دالة لتحويل الرقم العادي إلى أرقام بزخارف نباتية/ورود
function fancyNumber(num) {
    // تم استبدال الأرقام العادية بزخارف نصية أنيقة تشبه بتلات الورود أو الإطارات المزخرفة
    const floralDigits = ['𖠇','𖠈','𖠉','𖠊','𖠋','𖠌','𖠍','𖠎','𖠏','𖠐']; 
    // ملاحظة: يمكنك استخدام أرقام لاتينية مزخرفة إذا كنت تفضل الترتيب العددي الواضح
    const fancyDigits = ['𝟙','𝟚','𝟛','𝟜','𝟝','𝟞','𝟟','𝟠','𝟡','𝟙𝟘']; 
    
    // سنستخدم هنا مزيجاً يعطي طابع "الورود" أو الرموز الجمالية
    return ` ⚘ ${num} ⚘ `; 
}

module.exports = {
  config: {
    name: 'محظورين',
    version: '1.3',
    author: 'Hridoy / Enhanced by Gemini',
    countDown: 5,
    prefix: true,
    description: 'يعرض جميع المستخدمين المحظورين من البوت بزخارف ورود',
    category: 'أدوات',
    guide: {
      ar: '   {pn} - لعرض قائمة المحظورين المزخرفة'
    },
  },

  onStart: async ({ api, event }) => {
    try {
      const allUsers = Users.getAll(); 
      const bannedUsers = Object.values(allUsers).filter(user => user.isBanned);

      if (bannedUsers.length === 0) {
        return api.sendMessage('✅ لا يوجد مستخدمون محظورون حالياً.', event.threadID);
      }

      // تصميم الرسالة بزخارف "ورود" نصية
      let banListMessage = '┏━ 🍃 𝑩𝑨𝑵𝑵𝑬𝑫 𝑳𝑰𝑺𝑻 🍃 ━┓\n\n';
      
      bannedUsers.forEach((user, index) => {
        // زخرفة يدوية لكل سطر ليعطي إيحاء الغصن أو الوردة
        banListMessage += `  𓇬 『 ${index + 1} 』 ➪ ${user.name}\n      ╰─➤ 𝖨𝖣: ${user.userID}\n\n`;
      });

      banListMessage += '┗━━━━━━━━━━━━━━━┛\n⚠️ قائمة المحظورين من النظام.';

      api.sendMessage(banListMessage, event.threadID);

    } catch (error) {
      console.error("❌ خطأ في أمر قائمة الحظر:", error);
      api.sendMessage('❌ حدث خطأ أثناء جلب قائمة الحظر.', event.threadID);
    }
  },
};

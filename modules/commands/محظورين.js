const { Users } = require('../../database/database');

// دالة لتحويل الأرقام إلى النمط اللاتيني العريض للفخامة
function fancyNumber(num) {
    const digits = {
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
        '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return num.toString().split('').map(d => digits[d] || d).join('');
}

module.exports = {
  config: {
    name: 'محظورين',
    version: '2.0',
    author: 'Hridoy / Style 8',
    countDown: 5,
    prefix: true,
    description: 'عرض قائمة المحظورين بنمط الغسق الفخم',
    category: 'أدوات',
    guide: {
      ar: '   {pn} - لعرض المحظورين بزخرفة ملكية'
    },
  },

  onStart: async ({ api, event }) => {
    try {
      const allUsers = Users.getAll(); 
      const bannedUsers = Object.values(allUsers).filter(user => user.isBanned);

      if (bannedUsers.length === 0) {
        return api.sendMessage('✨ لا يوجد مستخدمون في قائمة الحظر حالياً.', event.threadID);
      }

      // بداية التصميم (النمط رقم 8)
      let banListMessage = '‹ 𖤓 ─━━━━━━⊱☆⊰━━━━━━─ 𖤓 ›\n\n';
      
      bannedUsers.forEach((user, index) => {
        const fNum = fancyNumber(index + 1);
        // تنسيق الاسم مع الأيقونة والـ ID بشكل مرتب
        banListMessage += `   𐂂  【 ${fNum} 】 :  ${user.name}\n   𑁍  𝖨𝖣: ${user.userID}\n\n`;
      });

      banListMessage += '‹ 𖤓 ─━━━━━━⊱☆⊰━━━━━━─ 𖤓 ›\n';
      banListMessage += '⚠️ تـم استـخـراج القـائمـة بنـجـاح.';

      api.sendMessage(banListMessage, event.threadID);

    } catch (error) {
      console.error("❌ خطأ في أمر قائمة الحظر:", error);
      api.sendMessage('❌ حدث خطأ أثناء جلب البيانات.', event.threadID);
    }
  },
};

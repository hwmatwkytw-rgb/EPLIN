const fs = require('fs-extra');

module.exports = {
  config: {
    name: "التفاعل",
    version: "1.5",
    author: "wsky ",
    countDown: 5,
    prefix: true,
    adminOnly: false,
    category: "إحصائيات",
    description: "عرض قائمة أكثر 5 أشخاص نشطين في المجموعة مع منشن للأول",
    guide: {
      en: "{pn}"
    },
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;

    try {
      // جلب معلومات المجموعة لاستخراج عدد الرسائل
      const threadInfo = await api.getThreadInfo(threadID);
      const { userInfo, messageCount } = threadInfo;

      if (!messageCount || Object.keys(messageCount).length === 0) {
        return api.sendMessage("⚠️ لا توجد بيانات تفاعل مسجلة حالياً.", threadID, messageID);
      }

      // تحويل البيانات لمصفوفة لترتيبها
      let stats = [];
      for (let user of userInfo) {
        let count = messageCount[user.id] || 0;
        if (count > 0) {
          stats.push({
            id: user.id,
            name: user.name,
            count: count
          });
        }
      }

      // الترتيب من الأكثر تفاعلاً للأقل
      stats.sort((a, b) => b.count - a.count);
      const top5 = stats.slice(0, 5);

      if (top5.length === 0) return api.sendMessage("⚠️ القائمة فارغة حالياً.", threadID, messageID);

      // بناء الرسالة المزخرفة
      let msg = "─── { 🏆 لـوحـة الـشـرف } ───\n\n";
      msg += `✨ أسطورة المجموعة حالياً هو: ${top5[0].name} !\n\n`;

      const icons = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      const ranks = ["الأسطورة الخالدة 👑", "القائد المتميز ✨", "المتفاعل الذهبي ⭐", "عضو نشط جداً 🔥", "بداية التألق 🌟"];
      
      const mentions = [];

      top5.forEach((user, index) => {
        msg += `${icons[index]} ┠ الـنـام: ${user.name}\n`;
        msg += `💬 ┠ الـرسـائل: 【 ${user.count.toLocaleString()} 】\n`;
        msg += `✨ ┖ الـرتـبـة: ${ranks[index]}\n\n`;

        // إضافة المنشن للمركز الأول
        if (index === 0) {
          mentions.push({
            tag: user.name,
            id: user.id
          });
        }
      });

      msg += "──────────────────\n";
      msg += "🎖️ تفاعلوا أكثر لتظهر أسماؤكم هنا!";

      return api.sendMessage({
        body: msg,
        mentions: mentions
      }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ فشل جلب البيانات، تأكد من صلاحيات البوت.", threadID, messageID);
    }
  }
};

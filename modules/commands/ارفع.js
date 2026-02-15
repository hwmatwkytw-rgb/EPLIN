module.exports = {
  config: {
    name: 'ارفع',
    version: '1.2',
    author: 'ابو عبيده علي',
    countDown: 5,
    prefix: false,
    adminOnly: false,
    description: 'رفع عضو مسؤول عن طريق الرد',
    category: 'إدارة'
  },

  run: async function ({ api, event }) {

    const { threadID, messageReply, senderID } = event;

    if (!messageReply)
      return api.sendMessage("❌ رد على رسالة العضو أولاً.", threadID);

    const developerID = "61586897962846";

    api.getThreadInfo(threadID, (err, info) => {
      if (err) return api.sendMessage("❌ فشل في جلب معلومات المجموعة.", threadID);

      const isAdmin = info.adminIDs.some(item => item.id == senderID);

      if (!isAdmin && senderID !== developerID)
        return api.sendMessage("❌ الأمر خاص بالأدمن والمطور فقط.", threadID);

      const targetID = messageReply.senderID;

      const isTargetAdmin = info.adminIDs.some(item => item.id == targetID);

      if (isTargetAdmin)
        return api.sendMessage("⚠️ العضو دا مسؤول أصلاً.", threadID);

      api.changeAdminStatus(threadID, targetID, true, (error) => {
        if (error)
          return api.sendMessage("❌ البوت ما عندو صلاحية يرفع مسؤول.", threadID);

        return api.sendMessage("✅ تم رفع العضو مسؤول بنجاح.", threadID);
      });

    });

  }
};

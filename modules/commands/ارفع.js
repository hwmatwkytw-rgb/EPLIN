module.exports = {
  config: {
    name: 'ارفع',
    version: '1.1',
    author: 'ابو عبيده علي',
    countDown: 5,
    prefix: false,
    adminOnly: false,
    aliases: [],
    description: 'رفع عضو مسؤول في المجموعة عن طريق الرد عليه',
    category: 'إدارة',
    guide: {
      ar: 'رد على رسالة العضو واكتب ارفع'
    }
  },

  run: async function ({ api, event }) {

    const { threadID, messageReply, senderID } = event;

    if (!messageReply)
      return api.sendMessage("❌ لازم ترد على رسالة العضو.", threadID);

    try {
      const threadInfo = await api.getThreadInfo(threadID);

      const isThreadAdmin = threadInfo.adminIDs.some(item => item.id == senderID);

      const developerID = "61586897962846"; // ايديك

      if (!isThreadAdmin && senderID !== developerID)
        return api.sendMessage("❌ الأمر دا خاص بمسؤولي المجموعة والمطور فقط.", threadID);

      const isTargetAdmin = threadInfo.adminIDs.some(item => item.id == messageReply.senderID);

      if (isTargetAdmin)
        return api.sendMessage("⚠️ العضو دا مسؤول أصلاً.", threadID);

      await api.changeAdminStatus(threadID, messageReply.senderID, true);

      return api.sendMessage("✅ تم رفع العضو مسؤول بنجاح.", threadID);

    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ فشل التنفيذ. تأكد إن البوت مسؤول في المجموعة.", threadID);
    }

  }
};

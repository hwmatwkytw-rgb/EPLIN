module.exports = {
  config: {
    name: 'ارفع',
    version: '1.0',
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

  run: async function ({ api, event, Threads, Users }) {

    const { threadID, messageReply, senderID } = event;

    if (!messageReply)
      return api.sendMessage("؟.", threadID);

    // جلب معلومات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);

    // التحقق هل المرسل أدمن في الجروب
    const isThreadAdmin = threadInfo.adminIDs.some(item => item.id == senderID);

    // ضع هنا ايدي المطور
    const developerID = "61586897962846";

    if (!isThreadAdmin && senderID !== developerID)
      return api.sendMessage("❌ الأمر دا خاص بمسؤولي المجموعة والمطور فقط.", threadID);

    try {
      await api.changeAdminStatus(threadID, messageReply.senderID, true);
      api.sendMessage("✅ تم رفع العضو مسؤول في المجموعة بنجاح.", threadID);
    } catch (error) {
      api.sendMessage("❌ حصل خطأ، تأكد إن البوت عندو صلاحية مسؤول أول.", threadID);
    }

  }
};

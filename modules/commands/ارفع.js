module.exports = {
  config: {
    name: "ارفع",
    version: "1.0",
    author: "ابو عبيده علي",
    countDown: 5,
    role: 1,
    description: "رفع عضو مسؤول بالرد عليه",
    category: "الإدارة",
    guide: { ar: "رد على رسالة العضو واكتب ارفع" }
  },

  onStart: async function ({ api, event }) {

    const { threadID, messageReply, senderID } = event;

    if (!messageReply)
      return api.sendMessage("❌ لازم ترد على رسالة العضو.", threadID, event.messageID);

    const developerID = "61586897962846";

    try {
      const info = await api.getThreadInfo(threadID);

      const isAdmin = info.adminIDs.some(item => item.id == senderID);

      if (!isAdmin && senderID !== developerID)
        return api.sendMessage("❌ الأمر خاص بالأدمن والمطور فقط.", threadID, event.messageID);

      const targetID = messageReply.senderID;

      const isTargetAdmin = info.adminIDs.some(item => item.id == targetID);
      if (isTargetAdmin)
        return api.sendMessage("⚠️ العضو دا مسؤول أصلاً.", threadID, event.messageID);

      await api.changeAdminStatus(threadID, targetID, true);

      return api.sendMessage("✅ تم رفع العضو مسؤول بنجاح.", threadID, event.messageID);

    } catch (err) {
      console.log(err);
      return api.sendMessage("❌ البوت لازم يكون مسؤول عشان يرفع عضو.", threadID, event.messageID);
    }
  }
};

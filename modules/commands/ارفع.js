module.exports = {
  config: {
    name: "ارفع",
    version: "1.0",
    author: "ابو عبيده علي",
    countDown: 5,
    role: 1,
    description: "رفع عضو مسؤول بالرد عليه",
    category: "group",
    guide: { ar: "رد على رسالة العضو واكتب ارفع" }
  },

  onStart: async function ({ api, event }) {

    const { threadID, messageReply, senderID } = event;

    if (!messageReply)
      return api.sendMessage("؟.", threadID, event.messageID);

    const developerID = "61586897962846";

    try {
      const info = await api.getThreadInfo(threadID);

      const isAdmin = info.adminIDs.some(item => item.id == senderID);

      if (!isAdmin && senderID !== developerID)
        return api.sendMessage("انغلع يا فلاح.", threadID, event.messageID);

      const targetID = messageReply.senderID;

      const isTargetAdmin = info.adminIDs.some(item => item.id == targetID);
      if (isTargetAdmin)
        return api.sendMessage("ادمن اصلا.", threadID, event.messageID);

      await api.changeAdminStatus(threadID, targetID, true);

      return api.sendMessage("🦧.", threadID, event.messageID);

    } catch (err) {
      console.log(err);
      return api.sendMessage("ارفع ادمن اول يا باطل 🦧.", threadID, event.messageID);
    }
  }
};

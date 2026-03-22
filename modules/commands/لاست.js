const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "لاست",
    version: "1.5.0",
    author: "سينكو",
    countDown: 15,
    role: 2, 
    description: "عرض قائمة المجموعات مع الزخرفة الجديدة",
    category: "owner",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const DEVELOPER_ID = "100081948980908";

    // إذا لم يكن المطور، يتفاعل بـ 🚯 على رسالة المستخدم
    if (senderID !== DEVELOPER_ID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }
    
    try {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const groups = inbox.filter(g => g.isGroup && g.isSubscribed);

      if (groups.length === 0) {
        return api.sendMessage("⚠️ البوت ليس عضواً في أي مجموعة حالياً.", threadID, messageID);
      }

      let msg = `●─────── ⌬ ───────●\n`;
      msg += `┇ ⦿ ⟬ قـائمة المجمـوعات (${groups.length}) ⟭\n┇\n`;
      
      const groupIds = [];
      const mentions = [];

      groups.forEach((g, i) => {
        const gName = g.name || "بدون اسم";
        const entry = `┇ الرقم: ${i + 1}\n┇ الاسم: ${gName}\n┇ الـ ID: ${g.threadID}\n┇──────────────\n`;
        
        mentions.push({
          tag: gName,
          id: g.threadID
        });
        
        msg += entry;
        groupIds.push(g.threadID);
      });

      msg += `┇ الـحـالـة: جـاري الإنـتـظـار... ⏳\n`;
      msg += `┇ رد بـ (خروج [الرقم]) أو (حظر)\n`;
      msg += `●─────── ⌬ ───────●`;

      return api.sendMessage({ body: msg, mentions }, threadID, (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          groupIds
        });
      }, messageID);

    } catch (err) {
      api.sendMessage("❌ حدث خطأ أثناء جلب القائمة.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, handleReply }) {
    const { body, threadID, messageID, senderID } = event;
    const DEVELOPER_ID = "61588108307572";
    
    if (senderID !== DEVELOPER_ID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    const args = body.split(/\s+/);
    const action = args[0];
    const index = parseInt(args[1]) - 1;

    if (isNaN(index) || index < 0 || index >= handleReply.groupIds.length) {
      return api.sendMessage("⚠️ رقم المجموعة غير صحيح!", threadID, messageID);
    }

    const targetID = handleReply.groupIds[index];

    if (action === "خروج" || action === "غادر") {
      api.removeUserFromGroup(api.getCurrentUserID(), targetID, (err) => {
        if (err) return api.sendMessage(`❌ فشل الخروج من المجموعة: ${targetID}`, threadID, messageID);
        api.sendMessage(`✅ تم الخروج من المجموعة بنجاح!\n🆔 ID: ${targetID}`, threadID, messageID);
      });
    } else if (action === "حظر") {
       api.sendMessage(`✅ تم تسجيل حظر المجموعة: ${targetID}`, threadID, messageID);
    }
  }
};

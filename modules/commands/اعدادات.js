const { Threads } = require('../../database/database');

module.exports = {
  config: {
    name: "اعدادات",
    version: "2.2",
    author: "سينكو & Gemini",
    countDown: 5,
    description: "إعدادات حماية المجموعة بنمط هندسي وأيقونات",
    category: "group",
  },

  onStart: async ({ api, event }) => {
    try {
      const { threadID, messageID } = event;
      if (!event.isGroup) return api.sendMessage('❌ هذا الأمر متاح للمجموعات فقط.', threadID);

      const threadData = Threads.get(threadID) || { settings: { anti: {} } };
      threadData.settings = threadData.settings || {};
      
      threadData.settings.anti = threadData.settings.anti || {
        antiSpam: false,
        antiOut: false,
        antiName: false,
        antiIcon: false,
        antiNickname: false
      };

      const anti = threadData.settings.anti;
      const statusIcon = (bool) => bool ? "✅" : "❌";

      // عرض القائمة بالنمط الهندسي والأقواس 『 』
      let msg = `◈ ─── إعدادات الحماية ─── ◈\n\n`;
      msg += `① ⠐ مكافحة السبام\n   ⭓ 『 ${statusIcon(anti.antiSpam)} 』\n\n`;
      msg += `② ⠐ منع الخروج\n   ⭓ 『 ${statusIcon(anti.antiOut)} 』\n\n`;
      msg += `③ ⠐ قفل اسم المجموعة\n   ⭓ 『 ${statusIcon(anti.antiName)} 』\n\n`;
      msg += `④ ⠐ قفل صورة المجموعة\n   ⭓ 『 ${statusIcon(anti.antiIcon)} 』\n\n`;
      msg += `⑤ ⠐ منع تغيير الكنيات\n   ⭓ 『 ${statusIcon(anti.antiNickname)} 』\n\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `│← رد على الرسالة بالرقم للتغيير\n`;
      msg += `│← الـحـالـة: جاهز للضبط 𓋹`;

      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      }, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ داخلي.', event.threadID);
    }
  },

  handleReply: async ({ api, event, handleReply }) => {
    const { threadID, messageID, body, senderID } = event;

    if (senderID !== handleReply.author) return;

    const choice = parseInt(body);
    const keys = ["antiSpam", "antiOut", "antiName", "antiIcon", "antiNickname"];
    
    if (isNaN(choice) || choice < 1 || choice > keys.length) {
      return api.sendMessage("⚠️ اختر رقم من 1 إلى 5.", threadID, messageID);
    }

    try {
      const threadData = Threads.get(threadID);
      const key = keys[choice - 1];
      
      threadData.settings.anti[key] = !threadData.settings.anti[key];
      Threads.set(threadID, threadData);

      const status = threadData.settings.anti[key] ? "✅" : "❌";
      
      // مسح القائمة القديمة
      api.unsendMessage(handleReply.messageID); 
      
      return api.sendMessage(`✅ تم تحديث الخيار رقم (${choice}) إلى 『 ${status} 』 بنجاح!`, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ فشل التحديث.", threadID);
    }
  }
};
  }
};

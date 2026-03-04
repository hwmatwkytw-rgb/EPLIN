module.exports = {
  config: {
    name: "اعدادات",
    version: "2.7",
    author: "سينكو & Gemini",
    countDown: 5,
    description: "إعدادات حماية المجموعة",
    category: "group",
  },

  onStart: async ({ api, event, Threads }) => {
    try {
      const { threadID, messageID, senderID } = event;
      if (!event.isGroup) return api.sendMessage('❌ هذا الأمر متاح للمجموعات فقط.', threadID);

      // في كنجي، Threads بتيجي جاهزة في الـ parameters
      let settings = (await Threads.getData(threadID)).settings || {};
      if (!settings.anti) {
        settings.anti = {
          antiSpam: false,
          antiOut: false,
          antiName: false,
          antiIcon: false,
          antiNickname: false
        };
      }

      const anti = settings.anti;
      const statusIcon = (bool) => bool ? "✅" : "❌";

      let msg = `◈ ─── إعدادات الحماية ─── ◈\n\n`;
      msg += `① ⠐ مكافحة السبام\n   ⭓ 『 ${statusIcon(anti.antiSpam)} 』\n\n`;
      msg += `② ⠐ منع الخروج\n   ⭓ 『 ${statusIcon(anti.antiOut)} 』\n\n`;
      msg += `③ ⠐ قفل اسم المجموعة\n   ⭓ 『 ${statusIcon(anti.antiName)} 』\n\n`;
      msg += `④ ⠐ قفل صورة المجموعة\n   ⭓ 『 ${statusIcon(anti.antiIcon)} 』\n\n`;
      msg += `⑤ ⠐ منع تغيير الكنيات\n   ⭓ 『 ${statusIcon(anti.antiNickname)} 』\n\n`;
      msg += `━━━━━━━━━━━━━━━━━\n`;
      msg += `│← رد على الرسالة برقم الخيار\n`;
      msg += `│← الـحـالـة: جاهز للضبط 𓋹`;

      return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage('❌ حدث خطأ في النظام.', event.threadID);
    }
  },

  handleReply: async ({ api, event, handleReply, Threads }) => {
    const { threadID, messageID, body, senderID } = event;

    if (senderID !== handleReply.author) return;

    const choice = parseInt(body);
    const keys = ["antiSpam", "antiOut", "antiName", "antiIcon", "antiNickname"];
    
    if (isNaN(choice) || choice < 1 || choice > keys.length) return;

    try {
      let data = await Threads.getData(threadID);
      let settings = data.settings || {};
      if (!settings.anti) settings.anti = {};

      const key = keys[choice - 1];
      settings.anti[key] = !settings.anti[key];
      
      // طريقة حفظ كنجي الصحيحة
      await Threads.setData(threadID, { settings });

      const status = settings.anti[key] ? "✅" : "❌";
      api.unsendMessage(handleReply.messageID); 
      
      return api.sendMessage(`✅ تم تحديث الخيار رقم (${choice}) إلى 『 ${status} 』 بنجاح!`, threadID, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage(`❌ فشل الحفظ، جرب مرة أخرى.`, threadID, messageID);
    }
  }
};

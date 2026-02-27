const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '2.6',
    author: 'Hridoy / Minimal Style',
    description: 'ترحيب انضمام البوت مع صورة وكنية احترافية.',
    eventType: ['log:subscribe'],
  },

  onStart: async ({ api, event }) => {
    try {
      const botID = api.getCurrentUserID();
      const addedParticipants = event.logMessageData?.addedParticipants || [];

      // التأكد أن البوت هو العضو الجديد
      if (!addedParticipants.some(user => user.userFbId === botID)) return;

      const botName = global.client.config.botName || ' 𝕒𝕡𝕝𝕚𝕟';
      const prefix = global.client.config.prefix || '/';

      // تغيير الكنية
      const shortNickname = `[ ${prefix} ] 𝕒𝕡𝕝𝕚𝕟🕸️`;
      api.changeNickname(shortNickname, event.threadID, botID);

      // زخرفة الترحيب
      const welcomeMsg = `
╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ▣ ${botName}  ▣
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯

  ◤ 🗝️ الـرمـز : ${prefix} ▣
  
  ◤ 📜 الـدليل : ${prefix}help ▣
  
  ◤ ๑ الـمطور : سينكو 17Y ▣

╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      🌹 صـلّ علـى الـنـبي 🌹
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

      const imgPath = __dirname + "/cache/bot_join.jpg";
      const imgUrl = "https://i.ibb.co/hJ47QQMM/1771089849331.jpg";

      // تحميل الصورة وإرسالها
      const response = await axios.get(imgUrl, { responseType: "arraybuffer" });
      await fs.outputFile(imgPath, Buffer.from(response.data, "utf-8"));

      api.sendMessage({
        body: welcomeMsg,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => {
        // حذف الصورة بعد الإرسال للحفاظ على مساحة التخزين
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });

    } catch (err) {
      console.error('[ERROR]:', err);
    }
  },
};

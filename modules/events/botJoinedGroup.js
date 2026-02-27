module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '2.5',
    author: 'Hridoy / Minimal Style',
    description: 'ترحيب انضمام البوت مع كنية احترافية وزخرفة الجوهرة.',
    eventType: ['log:subscribe'],
  },

  onStart: async ({ api, event }) => {
    try {
      const { Threads } = require('../../database/database');
      const botID = api.getCurrentUserID();
      const addedParticipants = event.logMessageData?.addedParticipants || [];

      if (!addedParticipants.some(user => user.userFbId === botID)) return;

      await Threads.create(event.threadID, 'New Group');
      const botName = global.client.config.botName || 'Kenji Cloud';
      const prefix = global.client.config.prefix || '!';

      // تغيير الكنية إلى الشكل الجديد: [ الرمز ] 𝕒𝕡𝕝𝕚𝕟🕸️
      const shortNickname = `[ ${prefix} ] 𝕒𝕡𝕝𝕚𝕟🕸️`;
      api.changeNickname(shortNickname, event.threadID, botID);

      // زخرفة الجوهرة التي اخترتها
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

      setTimeout(() => {
        api.sendMessage(welcomeMsg, event.threadID);
      }, 1000);

    } catch (err) {
      console.error('[ERROR]:', err);
    }
  },
};

module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '6.0',
    author: 'Hridoy / Dark Elite',
    description: 'ترحيب انضمام البوت بنمط النخبة المظلمة.',
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

      api.changeNickname(`〆 ${botName} 〆`, event.threadID, botID);

      // التصميم النخبوي (Dark Elite)
      const welcomeMsg = `
          × ──────────── ×
             𝗦𝗬𝗦𝗧𝗘𝗠  𝗥𝗘𝗔𝗗𝗬
          × ──────────── ×

          ⊹ 𝖭𝖺𝗆𝖾 : ${botName}
          ⊹ 𝖯𝗋𝖾𝖿𝗂𝗑 : ( ${prefix} )
          ⊹ 𝖧𝖾𝗅𝗉 : ${prefix}help

          ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
          ⌬ 𝖣𝖾𝗏𝖾𝗅𝗈𝗉𝖾𝗋 : 𝖲𝗂𝗇𝗄𝗈
          ⌬ 𝖠𝗀𝖾 : 𝟣𝟩 𝖸𝖾𝖺𝗋𝗌
          ⌬ ﷺ : صـلّوا علـى النبي
          ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
          × ──────────── ×`;

      setTimeout(() => {
        api.sendMessage(welcomeMsg, event.threadID);
      }, 1000);

    } catch (err) {
      console.error('[ERROR]:', err);
    }
  },
};

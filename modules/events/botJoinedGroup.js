module.exports = {
  config: {
    name: 'botJoinedGroup',
    version: '2.5',
    author: 'Hridoy / Minimal Style',
    description: 'ترحيب انضمام البوت بنمط المربعات النخبوي.',
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

      api.changeNickname(`[ ${prefix} ] • ${botName}`, event.threadID, botID);

      // تصميم المربعات النخبوي (Minimalist Squares)
      const welcomeMsg = `
■━━━━━━━━━━━━━━━━━━■
  .................
■━━━━━━━━━━━━━━━━━━■

  ▢ البوت : ${botName}
  ▢ الرمز : ${prefix}
  ▢ الدليل : أرسل [ ${prefix}help ]

■━━━━━━━━━━━━━━━━━━■
  ▣ المطور : سينكو ( 17Y )
  ▣ الصلاة على النبي ﷺ 🌹
■━━━━━━━━━━━━━━━━━━■`;

      setTimeout(() => {
        api.sendMessage(welcomeMsg, event.threadID);
      }, 1000);

    } catch (err) {
      console.error('[ERROR]:', err);
    }
  },
};

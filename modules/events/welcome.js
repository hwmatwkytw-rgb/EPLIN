const { log } = require('../../logger/logger');

// تخزين الأعضاء الذين تم الترحيب بهم لكل قروب
const welcomedUsers = new Set();

module.exports = {
  config: {
    name: 'welcome',
    version: '4.1',
    author: 'Hridoy + Abu Ubaida Edit',
    eventType: ['log:subscribe']
  },

  onStart: async ({ event, api }) => {
    try {
      if (event.logMessageType !== 'log:subscribe') return;

      const { threadID, logMessageData, author } = event;
      const botID = api.getCurrentUserID();

      // --- [ التعديل الجديد ] ---
      // إذا كان الشخص الذي قام بالإضافة هو البوت نفسه، لا يرسل ترحيب
      if (author == botID) return;

      if (!logMessageData?.addedParticipants) return;

      // فلترة البوت من الأعضاء الجدد (لو البوت انضاف للمجموعة)
      const newUsers = logMessageData.addedParticipants
        .map(p => p.userFbId)
        .filter(id => id !== botID);

      if (!newUsers.length) return;

      await sendGroupWelcome(api, threadID, newUsers);

    } catch (error) {
      log('error', `Welcome event error: ${error.message}`);
    }
  }
};

// ==================================
// إرسال رسالة الترحيب مع منشن رسمي
// ==================================
async function sendGroupWelcome(api, threadID, userIDs) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);

    const mentions = [];
    let bodyText = `╭━━〔نـورتـم مــجمـوعـــتنه〕━━╮\n\n`;

    let count = 1;

    for (const id of userIDs) {
      const key = `${id}_${threadID}`;
      if (welcomedUsers.has(key)) continue;

      welcomedUsers.add(key);

      try {
        const userInfo = await api.getUserInfo(id);
        const name = userInfo?.[id]?.name || "عضو جديد";
        const tag = `@${name}`;

        bodyText += ` ✦ ${count} ➜ ${tag}\n`;

        mentions.push({
          tag,
          id
        });

        count++;
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }

    if (!mentions.length) return;

    const memberCount = threadInfo.participantIDs.length;

    bodyText += `
━━━━━━━━━━━━━━━━━━
👥 عدد الأعضاء الآن : ${memberCount}
🎉 نتمنى لك أوقات ممتعة معنا
🤝 شارك – تفاعل – استمتع
💬 أي استفسار لا تتردد

   ≛ ⇄ 𝐓𝐍𝐗『 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 💫 』
╰━━━━━━━━━━━━━━━━━━╯`;

    await api.sendMessage(
      {
        body: bodyText,
        mentions
      },
      threadID
    );

    log('info', `Users welcomed with mention in ${threadID}`);

  } catch (error) {
    log('error', `sendGroupWelcome error: ${error.message}`);
  }
}

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

      // إذا كان الشخص الذي قام بالإضافة هو البوت نفسه، لا يرسل ترحيب
      if (author == botID) return;

      if (!logMessageData?.addedParticipants) return;

      // فلترة البوت من الأعضاء الجدد
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
// إرسال رسالة الترحيب - نسخة ضبط اتجاه الزقرة
// ==================================
async function sendGroupWelcome(api, threadID, userIDs) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const mentions = [];
    
    // أضفت \u200E في بداية كل سطر عشان الزقرة تفضل في الشمال
    let bodyText = `╭━━〔نـورتـم مــجمـوعـــتنه〕━━╮\n\u200E✾ ┇ ⸻⸻⸻⸻⸻\n\n`;

    let count = 1;

    for (const id of userIDs) {
      const key = `${id}_${threadID}`;
      if (welcomedUsers.has(key)) continue;

      welcomedUsers.add(key);

      try {
        const userInfo = await api.getUserInfo(id);
        const name = userInfo?.[id]?.name || "عضو جديد";
        const tag = `@${name}`;

        // ضبط اتجاه سطر المنشن
        bodyText += `\u200E✾ ┇  ✦ ${count} ➜ ${tag}\n`;

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

    // ضبط اتجاه باقي الرسالة والكلام الأصلي
    bodyText += `\n\u200E✾ ┇ ⸻⸻⸻⸻⸻\n` +
                `\u200E✾ ┇ 👥 عدد الأعضاء الآن : ${memberCount}\n` +
                `\u200E✾ ┇ 🎉 نتمنى لك أوقات ممتعة معنا\n` +
                `\u200E✾ ┇ 🤝 شارك – تفاعل – استمتع\n` +
                `\u200E✾ ┇ 💬 أي استفسار لا تتردد\n\n` +
                `\u200E✾ ┇    ≛ ⇄ 𝐓𝐍𝐗『 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 💫 』\n` +
                `╰━━━〔  ✾ 🕸 ✾  〕━━━╯`;

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

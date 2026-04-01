const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "صراحة",
    version: "3.0",
    author: "Fix Pro",
    countDown: 3,
    prefix: true,
    adminOnly: false,
    category: "fun",
    description: "صراحة + نقاط + تايمر + متجر",
    guide: {
      en: "{pn}"
    },
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    global.sarahaGame = global.sarahaGame || {};
    global.sarahaPoints = global.sarahaPoints || {};
    global.sarahaInv = global.sarahaInv || {};

    const questions = [
      "😏 هل كذبت اليوم؟",
      "💔 هل تحب شخص في السر؟",
      "🔥 ما هو أكبر سر تخفيه؟",
      "😅 هل ندمت على شيء؟",
      "👀 من أكثر شخص تكرهه؟",
      "💭 هل تفكر في شخص الآن؟",
      "🤫 ما هو سر لا يعرفه أحد عنك؟",
      "😈 هل فعلت شيء محرج؟"
    ];

    const shop = {
      hint: 3,
      skip: 5,
      double: 10
    };

    // 🛒 عرض المتجر
    if (args[0] === "متجر") {
      return api.sendMessage(
`🛒 متجر الصراحة:

🔹 hint = 3 نقاط
🔹 skip = 5 نقاط
🔹 double = 10 نقاط

💡 شراء: صراحة شراء hint`,
        threadID,
        messageID
      );
    }

    // 💰 شراء
    if (args[0] === "شراء") {
      let item = args[1];
      if (!shop[item]) return api.sendMessage("❌ عنصر غير موجود", threadID);

      let points = global.sarahaPoints[senderID] || 0;

      if (points < shop[item]) {
        return api.sendMessage("❌ نقاطك لا تكفي", threadID);
      }

      global.sarahaPoints[senderID] -= shop[item];

      global.sarahaInv[senderID] = global.sarahaInv[senderID] || {};
      global.sarahaInv[senderID][item] =
        (global.sarahaInv[senderID][item] || 0) + 1;

      return api.sendMessage(
`✅ تم شراء ${item}
💰 نقاطك الآن: ${global.sarahaPoints[senderID]}`,
        threadID,
        messageID
      );
    }

    try {
      let q = questions[Math.floor(Math.random() * questions.length)];
      let time = 15;

      api.sendMessage(
`💬 سؤال صراحة:

${q}

⏱️ لديك ${time} ثانية`,
        threadID,
        (err, info) => {

          global.sarahaGame[threadID] = {
            lastMsgID: info.messageID,
            expire: Date.now() + time * 1000
          };

          global.client.handleReply.push({
            name: "صراحة",
            messageID: info.messageID,
            type: "saraha"
          });

          // ⏱️ انتهاء الوقت
          setTimeout(() => {
            if (global.sarahaGame[threadID]) {
              delete global.sarahaGame[threadID];
              api.sendMessage("⏰ انتهى الوقت! لم يجب أحد.", threadID);
            }
          }, time * 1000);

        },
        messageID
      );

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ حدث خطأ", threadID, messageID);
    }
  },

  onReply: async function({ api, event }) {
    const { threadID, senderID, body } = event;

    if (!global.sarahaGame || !global.sarahaGame[threadID]) return;
    if (!body) return;

    let game = global.sarahaGame[threadID];

    // ⏱️ تحقق من الوقت
    if (Date.now() > game.expire) return;

    global.sarahaPoints[senderID] =
      (global.sarahaPoints[senderID] || 0) + 1;

    let points = global.sarahaPoints[senderID];

    const questions = [
      "😏 هل كذبت اليوم؟",
      "💔 هل تحب شخص في السر؟",
      "🔥 ما هو أكبر سر تخفيه؟",
      "😅 هل ندمت على شيء؟",
      "👀 من أكثر شخص تكرهه؟",
      "💭 هل تفكر في شخص الآن؟",
      "🤫 ما هو سر لا يعرفه أحد عنك؟",
      "😈 هل فعلت شيء محرج؟"
    ];

    try {

      // 🗑️ حذف السؤال القديم
      if (game.lastMsgID) {
        try {
          await api.unsendMessage(game.lastMsgID);
        } catch (e) {}
      }

      let newQ = questions[Math.floor(Math.random() * questions.length)];
      let time = 15;

      api.sendMessage(
`💬 سؤال جديد:

${newQ}

🏆 نقاطك: ${points}
⏱️ لديك ${time} ثانية`,
        threadID,
        (err, info) => {

          global.sarahaGame[threadID] = {
            lastMsgID: info.messageID,
            expire: Date.now() + time * 1000
          };

          global.client.handleReply.push({
            name: "صراحة",
            messageID: info.messageID,
            type: "saraha"
          });

          setTimeout(() => {
            if (global.sarahaGame[threadID]) {
              delete global.sarahaGame[threadID];
              api.sendMessage("⏰ انتهى الوقت! لم يجب أحد.", threadID);
            }
          }, time * 1000);

        }
      );

    } catch (error) {
      console.error(error);
    }
  }
};

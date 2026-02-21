const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
  config: {
    name: 'خمن',
    version: '1.1',
    author: 'Hridoy & Gemini',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'خمن الدولة بناءً على التلميح مع خيارات',
    category: 'لعب',
    guide: {
      ar: '{pn}خمن'
    }
  },

  onStart: async ({ api, event }) => {
    const { threadID, senderID } = event;

    try {
      const res = await axios.get('https://sus-apis-2.onrender.com/api/guess-country');
      const data = res.data;

      if (!data.success) {
        return api.sendMessage('❌ لم أتمكن من جلب بيانات الدولة. حاول لاحقاً.', threadID);
      }

      const { clue, options, answer } = data;
      const optionText = `🅐) ${options[0]}\n🅑) ${options[1]}\n🅒) ${options[2]}\n🅓) ${options[3]}`;

      const message = `●───── ⌬ ─────●\n┇\n⦿ ⟬ مسابقة التخمين ⟭\n┇ 𓋰 التلميح: ${clue}\n┇\n${optionText}\n┇\n⦿ ⟬ تعليمات ⟭\n┇ 𓋰 أجب بكتابة الحرف المناسب (a, b, c, d)\n●───── ⌬ ─────●`;

      const sentMsg = await api.sendMessage(message, threadID);

      global.client.handleReply.push({
        name: 'خمن',
        messageID: sentMsg.messageID,
        threadID,
        senderID,
        correctAnswer: answer.name,
        correctIndex: options.indexOf(answer.name),
        flagUrl: answer.flag_url,
        timeout: setTimeout(async () => {
          const idx = global.client.handleReply.findIndex(e => e.messageID === sentMsg.messageID);
          if (idx >= 0) {
            global.client.handleReply.splice(idx, 1);
            api.sendMessage('⏰ انتهى الوقت! حاول في المرة القادمة.', threadID);
          }
        }, 60000)
      });

    } catch (error) {
      log('error', `خطأ في خمن: ${error.message}`);
      api.sendMessage('❌ فشل بدء مسابقة الدولة. حاول لاحقاً.', threadID);
    }
  },

  handleReply: async ({ event, api, handleReply }) => {
    const { threadID, senderID, messageID, body } = event;
    const reply = body.trim().toLowerCase();

    if (event.messageReply.messageID !== handleReply.messageID) return;

    const validAnswers = ['a', 'b', 'c', 'd'];
    if (!validAnswers.includes(reply)) {
      return api.sendMessage('⚠️ الرجاء الرد بـ "a" أو "b" أو "c" أو "d" فقط.', threadID, messageID);
    }

    // إلغاء التوقيت وحذف البيانات من handleReply
    const idx = global.client.handleReply.findIndex(e => e.messageID === handleReply.messageID);
    if (idx >= 0) {
      clearTimeout(global.client.handleReply[idx].timeout);
      global.client.handleReply.splice(idx, 1);
    }

    const userAnswerIndex = { a: 0, b: 1, c: 2, d: 3 }[reply];
    const isCorrect = userAnswerIndex === handleReply.correctIndex;

    // إضافة التفاعل (Reaction)
    const reaction = isCorrect ? '✅' : '❌';
    api.setMessageReaction(reaction, messageID, () => {}, true);

    try {
      const response = await axios.get(handleReply.flagUrl, { responseType: 'arraybuffer' });
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      const imgPath = path.join(cacheDir, `flag_${Date.now()}.png`);
      fs.writeFileSync(imgPath, Buffer.from(response.data, 'binary'));

      const resultMsg = isCorrect
        ? `●───── ⌬ ─────●\n┇ ✅ أحسنت! إجابة صحيحة\n┇ 🌍 الدولة: ${handleReply.correctAnswer}\n●───── ⌬ ─────●`
        : `●───── ⌬ ─────●\n┇ ❌ للأسف إجابة خاطئة\n┇ ✨ الإجابة الصحيحة: ${handleReply.correctAnswer}\n●───── ⌬ ─────●`;

      await api.sendMessage({
        body: resultMsg,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });

    } catch (error) {
      api.sendMessage(isCorrect ? `✅ صح! الدولة هي ${handleReply.correctAnswer}` : `❌ خطأ! هي ${handleReply.correctAnswer}`, threadID);
    }
  }
};

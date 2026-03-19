module.exports = {
  config: {
    name: "صراحة",
    aliases: ["صراحه"],
    version: "2.0.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 0,
    category: "fun"
  },

  onStart: async function ({ api, event }) {
    return this.askQuestion(api, event);
  },

  // دالة لجلب سؤال عشوائي وإرساله
  askQuestion: async function (api, event) {
    const { threadID, messageID } = event;
    const questions = [
      'ما أسوأ شيء فعلته في الحياة؟',
      'حصل اتحرشو بيك ؟',
      'اسم امك منو ؟',
      'ما آخر قرار أخذته وندمت عليه؟',
      'ما أكثر شيء تكرهه في نفسك؟',
      'هل ظلمت أحد من قبل؟ كيف؟',
      'كيف ولماذا تركك الحبيب؟',
      'هل أحببت من طرف واحد من قبل؟',
      'هل غدر بك أعز صديق لك؟ كيف؟',
      'ما هو الشيء الذي يمثل لك خط أحمر؟',
      'من أقرب شخص لك في هذه المجموعة ؟',
      'أوصف حياتك في كلمة؟',
      'راضي عن شخصيتك ؟',
      'بتعمل شنو وقت تزعل ؟',
      'ترجع ل ex ?',
      'موقف محرج حصل معاك',
      'لونك المفضل'
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    const msg = `⊳ ${randomQuestion}\n\n[ رد بـ "نعم" أو "لا"   ]`;

    return api.sendMessage(msg, threadID, (err, info) => {
      // تسجيل الرد في global.client عشان البوت يراقب الرد على الرسالة دي بالذات
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });
    }, messageID);
  },

  // معالج الردود (الريلاي)
  onReply: async function ({ api, event, handleReply }) {
    const { body, threadID, messageID } = event;

    // التأكد إن الشخص اللي رد هو نفسه اللي طلب الأمر (اختياري)
    if (handleReply.author !== event.senderID) return;

    const input = body.toLowerCase().trim();

    if (input === "نعم" || input === "لا") {
      // حذف الـ handleReply القديم عشان ما يتكرر
      const index = global.client.handleReply.findIndex(item => item.messageID === handleReply.messageID);
      if (index !== -1) global.client.handleReply.splice(index, 1);

      // بدء سؤال جديد
      return this.askQuestion(api, event);
    }
  }
};

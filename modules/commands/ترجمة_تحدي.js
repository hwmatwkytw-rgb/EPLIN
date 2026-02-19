module.exports = {
  config: {
    name: "ترجمة_تحدي",
    version: "1.0",
    author: "Kenji Cloud",
    countDown: 5,
    prefix: true,
    description: "تحدي ترجمة الكلمات الإنجليزية",
    category: "fun",
    guide: { en: '{pn}' }
  },

  onStart: async function({ api, event }) {
    const words = [
      { en: "Achievement", ar: "إنجاز" },
      { en: "Challenge", ar: "تحدي" },
      { en: "Perspective", ar: "منظور" },
      { en: "Abundance", ar: "وفرة" },
      { en: "Innovation", ar: "ابتكار" },
      { en: "Resilience", ar: "مرونة" },
      { en: "Sustainability", ar: "استدامة" },
      { en: "Integrity", ar: "نزاهة" }
    ];
    const word = words[Math.floor(Math.random() * words.length)];
    
    const msg = `╭─── 『 🔠 تحدي الترجمة 』 ───╮\n  ما معنى كلمة: ${word.en}؟\n╰────────────────────╯\n\n💬 رد بالمعنى العربي الصحيح.`;
    
    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        correctAnswer: word.ar
      });
    }, event.messageID);
  },

  handleReply: async function({ api, event, handleReply }) {
    if (handleReply.author !== event.senderID) return;
    if (event.body.trim() === handleReply.correctAnswer) {
      api.unsendMessage(handleReply.messageID);
      return api.sendMessage("🎯 عبقري! ترجمة دقيقة.", event.threadID, event.messageID);
    } else {
      return api.sendMessage(`❌ خطأ. الترجمة هي: ${handleReply.correctAnswer}`, event.threadID, event.messageID);
    }
  }
};

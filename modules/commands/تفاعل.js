module.exports = {
  config: {
    name: "تفاعل",
    version: "1.5",
    author: "GatBot & Gemini",
    role: 0,
    category: "owner",
  },

  onChat: async ({ api, event }) => {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const text = body.toLowerCase();

    // 1. نظام التفاعل بالإيموجي (Reactions)
    if (text.includes("ضحك") || text.includes("ضحك")) {
      api.setMessageReaction("😆", messageID, () => {}, true);
    } 
    else if (text.includes("•-•") || text.includes("كاجويا")) {
      api.setMessageReaction("❤", messageID, () => {}, true);
    }
    else if (text.includes("حزن") || text.includes("زعلان")) {
      api.setMessageReaction("😢", messageID, () => {}, true);
    }
    else if (text.includes("احبك") || text.includes("يا ورع")) {
      api.setMessageReaction("😍", messageID, () => {}, true);
    }

    // 2. نظام الردود الكتابية السريعة (Auto Replies)
    const quickReplies = {
      "السلام عليكم": "وعليكم السلام ورحمة الله وبركاته يا منور! ",
      "منور": "النور نورك يا غالي 🌹",
      "كيفك": "بخير ما دمت بخير، كيف يمكنني مساعدتك؟ 😊",
      "بوت غبي": "أنا ذكاء اصطناعي، لكن يبدو أنك تحتاج لترقية في أسلوبك! 😏",
      "«•-•» ": "تفضلي يا الاخت 😕"
    };

    if (quickReplies[text]) {
      return api.sendMessage(quickReplies[text], threadID, messageID);
    }
  }
};

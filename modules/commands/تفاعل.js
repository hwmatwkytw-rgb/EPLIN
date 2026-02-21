module.exports = {
  config: {
    name: "تفاعل",
    version: "2.0",
    author: "Gemini - Modified by ChatGPT",
    countDown: 0,
    prefix: false,
    category: "owner"
  },

  // يخلي البوت يحذف رسالته لو اتعمل ليها تفاعل 🗑️
  onReaction: async ({ api, event }) => {
    try {
      // نتأكد انو التفاعل هو سلة المهملات
      if (event.reaction !== "🗑️") return;

      // نتأكد انو الرسالة المتفاعل عليها مرسلة من البوت
      const messageInfo = await api.getMessage(event.messageID);
      if (!messageInfo || messageInfo.senderID !== api.getCurrentUserID()) return;

      // حذف رسالة البوت
      await api.unsendMessage(event.messageID);

    } catch (error) {
      console.log("Error deleting message:", error);
    }
  }
};

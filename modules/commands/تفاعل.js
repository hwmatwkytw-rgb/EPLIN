module.exports = {
  config: {
    name: 'تفاعل',
    version: '1.0',
    author: 'Gemini',
    countDown: 0,
    prefix: false,
    category: 'owner',
  },
  onStart: async ({ api, event }) => {
    if (event.senderID !== "61588108307572") return;
    return api.setMessageReaction("🖤", event.messageID, (err) => {}, true);
  }
};

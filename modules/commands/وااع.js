const fs = require('fs-extra');

const TARGET_ID = '61553078794576'; // الشخص اللي يقدر يفعل الغزل

module.exports = {
  config: {
    name: 'وااع',
    version: '2.0',
    author: 'Modified by ChatGPT',
    countDown: 0,
    prefix: false,
    description: 'يرد فقط على شخص معين بكلام غزل 😏',
    category: 'fun'
  },

  handleEvent: async ({ api, event }) => {
    try {
      const { body, threadID, messageID, senderID } = event;

      // تحقق: فقط هذا الإيدي
      if (senderID !== TARGET_ID) return;

      // تحقق من الكلمة
      if (!body || body.toLowerCase() !== "وااع") return;

      const messages = [
        "وااع 😳❤️ وش هالجمال!",
        "يا عمري انت غير 🥺🔥",
        "والله الجمال كله فيك 😏💘",
        "قلبي وقف لما شفتك 😵‍💫❤️",
        "انت مش إنسان... انت لوحة فنية 😍🎨",
        "مين سمح لك تكون كذا جميل؟ 😤❤️"
      ];

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];

      return api.sendMessage(randomMsg, threadID, messageID);

    } catch (error) {
      console.error(error);
    }
  }
};

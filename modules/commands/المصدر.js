module.exports = {
  config: {
    name: "المصدر",
    version: "1.0",
    author: "Kenji",
    countDown: 5,
    prefix: true,
    category: "fun",
    description: "معلومات المصدر والمطور الأساسي"
  },

  onStart: async ({ api, event }) => {
    const msg = `
   / / 𝗦𝗢𝗨𝗥𝗖𝗘  𝗜𝗡𝗙𝗢  / /
   
   ❯ 𝖡𝗈𝗍 : 𝖤𝗉𝗅𝗂𝗇   𝖵2
   ❯ 𝖣𝖾𝗏 : 𝖲𝗂𝗇𝗄𝗈 (سينكو)
   ❯ 𝖫𝖺𝗇𝗀 : 𝖩𝖺𝗏𝖺𝖲𝖼𝗋𝗂𝗉𝗍
   
   [ ----------------------- ]
    ⌬ 𝖢𝗈𝗉𝗒𝗋𝗂𝗀𝗁𝗍 © 𝟤𝟢𝟤𝟨
    ⌬ 𝖯𝗈𝗐𝖾𝗋𝖾𝖽 𝖻𝗒 🦋
   [ ----------------------- ]`;

    api.sendMessage(msg, event.threadID);
  }
};

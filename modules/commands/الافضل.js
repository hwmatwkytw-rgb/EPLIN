module.exports = {
  config: {
    name: "الافضل",
    version: "1.0",
    author: "سينكو",
    countDown: 5,
    prefix: true,
    category: "fun",
    description: "عرض قائمة النخبة في المجموعة"
  },

  onStart: async ({ api, event }) => {
    const msg = `
          ╭  𝗣 𝗥 𝗘 𝗠 𝗜 𝗨 𝗠  ╮
          
          𝟙. ⟬ سينكو ⟭ 
             𓋰 Exp: 𝟫𝟫𝟫,𝟫
          
          𝟚. ⟬ كينجي ⟭ 
             𓋰 Exp: 𝟪𝟧𝟢,𝟢
          
          𝟛. ⟬ مستخدم ⟭ 
             𓋰 Exp: 𝟩𝟢𝟢,𝟢
          
          ╰  ─━━━━━─  ╯
          ⌬ 𝖱𝖺𝗇𝗄: 𝖦𝗅𝗈𝖻𝖺𝗅
          ⌬ 𝖴𝗉𝖽𝖺𝗍𝖾: 𝖫𝗂𝗏𝖾`;

    api.sendMessage(msg, event.threadID);
  }
};

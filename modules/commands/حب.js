module.exports = {
  config: {
    name: "حب",
    version: "1.0",
    author: "Kenji",
    countDown: 5,
    prefix: true,
    category: "fun",
    description: "قياس التوافق بين شخصين بنظام ذكي"
  },

  onStart: async ({ api, event, args }) => {
    const mention = Object.keys(event.mentions);
    if (mention.length == 0) return api.sendMessage("⊹ يرجى منشن الشخص أولاً.", event.threadID);
    
    const percentage = Math.floor(Math.random() * 100);
    const name = event.mentions[mention[0]].replace("@", "");

    const msg = `
          × ──────────── ×
             𝗟𝗢𝗩𝗘  𝗗𝗘𝗧𝗘𝗖𝗧𝗢𝗥
          × ──────────── ×

          ⊹ الشريك : ${name}
          ⊹ النسبة : [ ${percentage}% ]
          ⊹ الحالة : ${percentage > 50 ? 'متوافقين ✅' : 'غير متوافقين ❌'}

          ⎯⎯⎯⎯⎯⎯⎯⎯⎯
          ⌬ 𝖬𝗈𝖽𝖾 : 𝖠𝗇𝖺𝗅𝗒𝗓𝗂𝗇𝗀
          ⌬ 𝖳𝗒𝗉𝖾 : 𝖤𝗆𝗈𝗍𝗂𝗈𝗇𝖺𝗅
          
          × ──────────── ×`;

    api.sendMessage(msg, event.threadID, event.messageID);
  }
};

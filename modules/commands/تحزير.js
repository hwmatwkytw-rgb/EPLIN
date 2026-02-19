module.exports = {
  config: {
    name: "تحذير",
    version: "1.0",
    author: "Kenji",
    countDown: 2,
    prefix: true,
    category: "admin",
    description: "توجيه إنذار رسمي لعضو"
  },

  onStart: async ({ api, event, args }) => {
    const mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("⊹ يرجى منشن المخالف.", event.threadID);

    const msg = `
          ⎾  𝗦𝗬𝗦𝗧𝗘𝗠   ⏌
          
          ◈ الـمـسـتهـدف : ${event.mentions[mention]}
          ◈ الـسـبـب : مـخـالـفـة الـنـظـام
          ◈ الـإجـراء : إنـذار نـهـائـي
          
          ⎿  ─━━━━━━━─  ⏌
          ⌬ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝖱𝖾𝖼𝗈𝗋𝖽𝖾𝖽
          ⌬ 𝖠𝖽𝗆𝗂𝗇: 𝖲𝗒𝗌𝗍𝖾𝗆
          ⎾  ───────────  ⏌`;

    api.sendMessage(msg, event.threadID);
  }
};

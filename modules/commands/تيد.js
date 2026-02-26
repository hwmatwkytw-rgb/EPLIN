module.exports = {
  config: {
    name: 'تيد',
    aliases: ['id', 'معلوماتي'],
    version: '1.5',
    author: 'Luffy Mod',
    description: 'عرض معلومات حسابك الشخصي',
    countDown: 5,
    prefix: true,
    category: 'fun'
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    
    api.setMessageReaction("👒", messageID, (err) => {}, true);

    try {
      const info = await api.getUserInfo(senderID);
      const name = info[senderID].name;
      const gender = info[senderID].gender == 2 ? "ذكـر" : "أنـثـى";

      const message = 
`        🧸
    ●───ฅ──────────ฅ───●
    ┇
    ⦿        ⟬ الـهـويـة ⟭
    ┇       𓆸 الاسـم: 『 ${name} 』
    ┇
    ⦿     ⟬ الـمـعـلومـات ⟭
    ┇      𓆸 الأيـدي: ${senderID}
    ┇       𓆸 الـجـنـس: ${gender}
    ┇
    ⦿ ⟬ الـرابط ⟭
    ┇      𓆸 الـحـساب: fb.com/${senderID}
    ┇
    ●──────── 𓆰 ────────●
       𝑳𝑼𝑭𝑭𝒀 𝑰𝑵𝑭𝑶 𝑺𝒀𝑺𝑻𝑬𝑴`;

      api.sendMessage(message, threadID, messageID);
    } catch (error) {
      api.sendMessage("●─────── ❌ فشل جلب البيانات ───────●", threadID, messageID);
    }
  }
};

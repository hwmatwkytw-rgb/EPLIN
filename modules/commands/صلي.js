module.exports = {
  config: {
    name: "صلي",
    version: "1.0",
    author: "Kenji",
    countDown: 2,
    prefix: true,
    category: "fun",
    description: "تذكير بالصلاة على النبي ﷺ"
  },

  onStart: async ({ api, event }) => {
    const msg = `
          ‹ 𖤓 ⊱༻⊰ 𖤓 ›

       اللَّهُمَّ صَلِّ وَسَلِّمْ 
       وَبَارِكْ عَلَى نَبِيِّنَا 
           مُحَمَّدٍ ﷺ

      ‹ 𖤓 ─━━━━━─ 𖤓 ›
       ⌬ ذكـير : سـينـكو
       ⌬ الـحالة : أجـر مسـتمر
      ‹ 𖤓 ─━━━━━─ 𖤓 ›`;

    api.sendMessage(msg, event.threadID);
  }
};

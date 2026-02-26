Module.exports = {
  config: {
    name: 'اقتباس',
    aliases: ['quote', 'حكمة'],
    version: '1.0',
    author: ' سينكو',
    description: 'عرض اقتباسات وحكم فخمة',
    countDown: 3,
    prefix: true,
    category: 'fun'
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID } = event;
    const quotes = [
      "الجمال في البساطة، والفخامة في الأخلاق.",
      "كن أنت النسخة الأفضل من نفسك دائماً.",
      "لا تتوقف حتى تصبح فخوراً بنفسك.",
      "الصمت فخامة لا يعرفها إلا عشاق الهدوء."
    ];
    const randQuote = quotes[Math.floor(Math.random() * quotes.length)];

    api.setMessageReaction("🖤", messageID, (err) => {}, true);

    const message = 
` ──────── ✇ ──────── 
    
     ⟦ اقـتـبـاس  ⟧
    
      『 ${randQuote} 』
 ───────────────────
     ⟦ الـمـصـدر ⟧
      الـمـكـان: قـلـب ابلين 
    
 ──────── ✇ ──────── `;

    api.sendMessage(message, threadID, messageID);
  }
};

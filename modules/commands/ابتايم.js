const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'up'],
    version: '1.5',
    author: 'Hridoy',
    description: 'معلومات تشغيل النظام والبوت بموديل الفتات الفخم',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: true
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID } = event;

    // التفاعل برمز العنكبوت المفضل لديكِ
    api.setMessageReaction("🕸", messageID, (err) => {}, true);

    const waitingMsg = await api.sendMessage(
      '◄ جاري استخراج البيانات... ►',
      threadID,
      messageID
    );
    const processingID = waitingMsg.messageID;

    try {
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB';
      const ping = Math.floor(performance.now() % 1000) + ' ms';
      const time = moment().format('hh:mm:ss A');
      const date = moment().format('YYYY/MM/DD');

      // تطبيق التصميم المختار (المنحني مع خطوط الوسط)
      const message = 
`      (◍•ᴗ•◍) 🖤
\`\`\`
╭───ฅ──────────ฅ───╮
│ ⦿ ⟬ 𝑺𝒀𝑺𝑻𝑬𝑴 𝑰𝑵𝑭𝑶 ⟭
├───────────────
│
│    🕸 الـتـوقـيت ⪼ ${time}
│
├───────────────
│
│   🕸 الـسـرعـة ⪼ ${ping}
│
├───────────────
│
│   🕸 الـرامــات ⪼ ${ramUsage}
│
├───────────────
│
│   🕸 الـتـشـغـيل ⪼ ${uptime}
│
╰───── 𓆩 🕸 𓆪 ─────╯
\`\`\``;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('●─────── ❌ فشل الجلب ───────●', processingID);
    }
  },
};

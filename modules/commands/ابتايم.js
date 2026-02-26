const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'حالة_البوت'],
    version: '1.4',
    author: 'Hridoy',
    description: 'معلومات تشغيل النظام والبوت بموديل الدبدوب المبتسم',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: true
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID } = event;

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

      // تم إضافة علامة ``` لضمان ثبات الخط وعدم تشتت الزخرفة
      const message = 
`        (◍•ᴗ•◍) 🖤
\`\`\`
●───ฅ──────────ฅ───●

⦿ ⟬ الـتـشـغـيـل ⟭
 𓆸 الـوقت: 『 ${uptime} 』

⦿ ⟬ الاسـتـهـلاك ⟭
 𓆸 الـرام: 『 ${ramUsage} 』

⦿ ⟬ الاسـتـجـابـة ⟭
 𓆸 الـبـنـغ: 『 ${ping} ms 』

⦿ ⟬ الـمـعـلومـات ⟭
  𓆸 الـتـوقـيت: ${time}
  𓆸 الـتـاريـخ: ${date}

⦿ ⟬ الـحـالـة ⟭
  𓆸 الـوضع: 『 مـسـتـقـر ✨ 』

●──────── 🕸 ────────●
\`\`\``;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('●─────── ❌ فشل الجلب ───────●', processingID);
    }
  },
};

const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'up'],
    version: '1.5',
    author: 'Hridoy',
    description: 'معلومات تشغيل النظام والبوت بالزخرفة والخطوط الوسطى',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: true
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID } = event;

    api.setMessageReaction("🖤", messageID, (err) => {}, true);

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

      // التصميم الموحد مع أمر البادئة (الخطوط الدائرية + الورود)
      const message = 
`●─────── ✾ ⌬ ✾ ───────●
✾ ┇
✾ ┇ ◤ ⏰ الـتـوقـيت : ${time} ▣
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◤ 🕸 الـسـرعـة : ${ping} ▣
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◤ 🕸 الـرامات : ${ramUsage} ▣
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇ ◤ 🕸 الـتـشغيل : ${uptime} ▣
✾ ┇
●────── ✾ ⌬ ✾ ────────●`;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('●───── ✾ ❌ فشل الجلب ✾ ────●', processingID);
    }
  },
};

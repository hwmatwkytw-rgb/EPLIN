const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'up', 'stats'],
    version: '2.0',
    author: 'سينكو',
    description: 'عرض حالة النظام وإحصائيات البوت بالكامل',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: false
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID } = event;

    api.setMessageReaction("🧭", messageID, (err) => {}, true);

    const waitingMsg = await api.sendMessage(
      '✾ ┇ جاري فحص حالة النظام... ⏳',
      threadID,
      messageID
    );
    const processingID = waitingMsg.messageID;

    try {
      // حساب وقت التشغيل
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // معلومات الذاكرة والنظام
      const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const ping = Math.floor(performance.now() % 1000);
      const time = moment().format('hh:mm:ss A');
      
      // إحصائيات البوت
      const threadCount = (await api.getThreadList(100, null, ["INBOX"])).length;
      const userCount = global.data.allUserID ? global.data.allUserID.length : 'غير متوفر';

      // بناء الرسالة بالزخرفة المطلوبة
      const message = 
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇
✾ ┇ ⏣ ⟬ حـالـة الـنـظـام ⟭
✾ ┇ ◍ الـوقت: ${time}
✾ ┇ ◍ الـبـنـغ: ${ping}ms
✾ ┇ ◍ الـتـشغيل: ${uptimeStr}
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇
✾ ┇ ⏣ ⟬ إحـصـائـيـات الـبـوت ⟭
✾ ┇ ◍ الـمجموعات: ${threadCount}
✾ ┇ ◍ الـمستخدمين: ${userCount}
✾ ┇ ◍ الـرام المستهلكة: ${ramUsage}MB
✾ ┇ ◍ إجمالي الـرام: ${totalRam}GB
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇
✾ ┇⏣ ⟬ مـعـلـومـات الـسـيـرفـر ⟭
✾ ┇ ◍ الـنظام: ${os.type()} ${os.arch()}
✾ ┇ ◍ الـمعالج: ${os.cpus()[0].model.split(' ')[0]}
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣
 ⠇حـالة الـبوت: مـتصل بنجاح ✅`;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('⏣── ✾ ❌ فشل في جلب البيانات ✾ ──⏣', processingID);
    }
  },
};

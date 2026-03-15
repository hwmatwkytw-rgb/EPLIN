const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'up', 'stats'],
    version: '2.6',
    author: 'سينكو',
    description: 'عرض حالة النظام وإحصائيات البوت مع معالجة الأخطاء',
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
      // 1. حساب وقت التشغيل
      const uptimeSeconds = process.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = Math.floor(uptimeSeconds % 60);
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      // 2. معلومات الذاكرة والنظام
      const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const ping = Math.floor(performance.now() % 1000);
      const time = moment().format('hh:mm:ss A');
      
      // 3. إحصائيات البوت (مع معالجة خطأ الجلب)
      let threadCount = 'غير متوفر';
      let userCount = 'غير متوفر';

      try {
        const threadList = await api.getThreadList(100, null, ["INBOX"]);
        threadCount = threadList.length;
      } catch (e) { console.log("تعذر جلب المجموعات"); }

      if (global.data && global.data.allUserID) {
        userCount = global.data.allUserID.length;
      }

      // بناء الرسالة
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
✾ ┇ ⏣ ⟬ مـعـلـومـات الـسـيـرفـر ⟭
✾ ┇ ◍ الـنظام: ${os.type()} ${os.arch()}
✾ ┇ ◍ الـمعالج: ${os.cpus()[0].model.split(' ')[0]}
✾ ┇ ⸻⸻⸻⸻⸻
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣
 ⠇الـمـطـوࢪ: سينكو 𓆩☆𓆪
 ⠇حـالة الـبوت: مـتصل بنجاح ✅`;

      api.editMessage(message, processingID);

    } catch (error) {
      console.error('Uptime error:', error);
      api.editMessage('⏣── ✾ ❌ حدث خطأ داخلي أثناء الجلب ✾ ──⏣', processingID);
    }
  },
};

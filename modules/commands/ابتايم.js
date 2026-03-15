const os = require('os');
const { performance } = require('perf_hooks');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

module.exports = {
  config: {
    name: 'ابتايم',
    aliases: ['uptime', 'up', 'stats'],
    version: '2.8',
    author: 'سينكو',
    description: 'عرض حالة النظام (للمطور فقط)',
    countDown: 5,
    prefix: true,
    category: 'utility',
    adminOnly: true // تم تفعيل خيار الإدارة فقط هنا أيضاً كطبقة حماية أولى
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    const config = readDB(configPath);
    const adminList = config.adminUIDs || [];

    // التحقق الصارم من أن المستخدم هو المطور
    if (!adminList.includes(senderID)) {
      return api.sendMessage("", threadID, messageID);
    }

    api.setMessageReaction("🧭", messageID, (err) => {}, true);

    const waitingMsg = await api.sendMessage(
      '✾ ┇ جاري استخراج بيانات النظام الخاصة... ⏳',
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
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const ramUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const ping = Math.floor(performance.now() % 1000);
      const time = moment().format('hh:mm:ss A');
      
      // جلب إحصائيات البوت
      let threadCount = 'غير متوفر';
      let userCount = 'غير متوفر';

      try {
        const threadList = await api.getThreadList(100, null, ["INBOX"]);
        threadCount = threadList.length;
      } catch (e) {}

      if (global.data && global.data.allUserID) {
        userCount = global.data.allUserID.length;
      }

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

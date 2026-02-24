const { exec } = require("child_process");

module.exports = {
  config: {
    name: "ترمينال", // يمكنك تسميته shell أو نظام
    version: "1.0",
    author: "Kaguya-Project",
    role: 2, // مهم جداً: للمطور فقط (AdminBot)
    countDown: 0,
    category: "owner",
    guide: "{pn} [الأمر]"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    // تجميع الأمر من المدخلات
    const command = args.join(" ");
    
    if (!command) {
      return api.sendMessage("⚠️ يرجى إدخال الأمر المراد تنفيذه في الترمينال.", threadID, messageID);
    }

    // رسالة انتظار لأن بعض الأوامر قد تستغرق وقتاً
    api.sendMessage(`⏳ جاري تنفيذ: ${command}...`, threadID, (err, info) => {
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return api.sendMessage(`❌ خطأ في التنفيذ:\n${error.message}`, threadID, messageID);
        }
        if (stderr) {
          return api.sendMessage(`⚠️ تنبيه النظام:\n${stderr}`, threadID, messageID);
        }
        
        // إذا كانت النتيجة طويلة جداً، يتم تقصيرها لإرسالها في ماسنجر
        const output = stdout.length > 1900 ? stdout.substring(0, 1900) + "..." : stdout;
        
        return api.sendMessage(`✅ المخرجات:\n\n${output || "تم التنفيذ بنجاح (لا توجد مخرجات نصية)."}\n`, threadID, messageID);
      });
      
    }, messageID);
  }
};

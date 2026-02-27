const { exec } = require("child_process");

module.exports = {
  config: {
    name: "ترمينال",
    version: "1.0",
    author: "Kaguya-Project",
    role: 2, 
    countDown: 0,
    category: "owner",
    guide: "{pn} [الأمر]"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;

    // أيدي المطور الخاص بك
    const DEVELOPER_ID = "61588108307572";

    // التحقق من الهوية (إذا لم يكن المطور، يتفاعل بالإيموجي)
    if (senderID !== DEVELOPER_ID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    const command = args.join(" ");
    
    if (!command) {
      return api.sendMessage("⚠️ يرجى إدخال الأمر المراد تنفيذه في الترمينال.", threadID, messageID);
    }

    api.sendMessage(`⏳ جاري تنفيذ: ${command}...`, threadID, (err, info) => {
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return api.sendMessage(`❌ خطأ في التنفيذ:\n${error.message}`, threadID, messageID);
        }
        if (stderr) {
          return api.sendMessage(`⚠️ تنبيه النظام:\n${stderr}`, threadID, messageID);
        }
        
        const output = stdout.length > 1900 ? stdout.substring(0, 1900) + "..." : stdout;
        
        return api.sendMessage(`✅ المخرجات:\n\n${output || "تم التنفيذ بنجاح (لا توجد مخرجات نصية)."}\n`, threadID, messageID);
      });
      
    }, messageID);
  }
};

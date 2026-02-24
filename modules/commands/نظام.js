const { exec } = require("child_process");

module.exports = {
  config: {
    name: "نظام",
    version: "1.0",
    author: "Kaguya-Project",
    role: 2, // للمطور الأساسي فقط
    category: "owner",
    guide: "{pn} [أمر ترمينال]"
  },

  onStart: async ({ api, event, args }) => {
    const command = args.join(" ");
    if (!command) return api.sendMessage("⚠️ أين الأمر؟", event.threadID);

    exec(command, (error, stdout, stderr) => {
      if (error) return api.sendMessage(`❌ خطأ:\n${error.message}`, event.threadID);
      if (stderr) return api.sendMessage(`⚠️ تنبيه:\n${stderr}`, event.threadID);
      return api.sendMessage(`✅ المخرجات:\n${stdout}`, event.threadID);
    });
  }
};

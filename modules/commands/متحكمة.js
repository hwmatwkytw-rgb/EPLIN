module.exports = {
  config: {
    name: "إبلين",
    version: "1.5.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 0,
    category: "system",
    guide: "نادي البوت باسمه: ابلين [اسم الأمر]"
  },

  onChat: async function ({ api, event, threadsData, usersData, dashBoard }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const botName = "إبلين";
    const input = body.toLowerCase().trim();

    // بنتحقق لو الكلام بيبدأ بـ "ابلين"
    if (input.startsWith(botName)) {
      
      // تنظيف النص من الكلمات الزايدة
      let commandText = input
        .replace(botName, "")
        .replace("شغلي", "")
        .replace("فحي", "")
        .trim();

      if (!commandText) return; // لو ناديت "ابلين" بس ما يسوي شي

      const args = commandText.split(" ");
      const commandName = args.shift();

      // البحث عن الأمر في الكلاينت
      const command = global.client.commands.get(commandName) || 
                      Array.from(global.client.commands.values()).find(cmd => cmd.config.aliases && cmd.config.aliases.includes(commandName));

      if (command && command.onStart) {
        try {
          // التفاعل عشان تعرف إنها سمعت
          api.setMessageReaction("🧞", messageID, () => {}, true);

          // تنفيذ الأمر مباشرة
          await command.onStart({
            api,
            event: { ...event, body: `${global.client.config.PREFIX}${commandName} ${args.join(" ")}` },
            args: args,
            threadsData,
            usersData,
            dashBoard
          });
        } catch (error) {
          console.error(error);
          // ما نرسل رسالة خطأ في الشات عشان ما نزعج المستخدم لو في غلط بسيط
        }
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("نظام التحكم بالاسم شغال يا أبو عبيدة! جرب تقول: 'ابلين ابتايم'.", event.threadID);
  }
};

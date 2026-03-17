module.exports = {
  config: {
    name: "إبلين", // خليت اسم الأمر هو نفسه اسم البوت عشان يلقط الكلام
    version: "2.0.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 0,
    category: "system",
    guide: "فقط قول: ابلين [اسم الأمر]"
  },

  onChat: async function ({ api, event, threadsData, usersData, dashBoard }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const botName = "إبلين";
    const input = body.toLowerCase().trim();

    // فحص: هل الكلام يبدأ بـ "ابلين"؟
    if (input.startsWith(botName)) {
      
      // تنظيف النص
      let commandText = input
        .replace(botName, "")
        .replace("شغلي", "")
        .replace("فحي", "")
        .replace("أمر", "")
        .trim();

      if (!commandText) return; // لو قال ابلين بس ما يعمل شي

      const args = commandText.split(" ");
      const commandName = args.shift();

      // البحث عن الأمر المطلوب (غير أمر ابلين نفسه عشان ما يدخل في دوامة)
      if (commandName === "ابلين") return;

      const command = global.client.commands.get(commandName) || 
                      Array.from(global.client.commands.values()).find(cmd => cmd.config.aliases && cmd.config.aliases.includes(commandName));

      if (command && command.onStart) {
        try {
          // التفاعل
          api.setMessageReaction("🧞", messageID, () => {}, true);

          // تشغيل الأمر المطلوب
          await command.onStart({
            api,
            event: { ...event, body: `${global.client.config.PREFIX}${commandName} ${args.join(" ")}` },
            args: args,
            threadsData,
            usersData,
            dashBoard
          });
        } catch (error) {
          console.error("خطأ في المتحكم:", error);
        }
      }
    }
  },

  // الـ onStart دي حنخليها فاضية أو رسالة تعريفية بس لما تكتب /ابلين
  onStart: async function ({ api, event }) {
    api.sendMessage("أنا بسمعك يا أبو عبيدة من غير بادئة! قولي: 'ابلين ابتايم' مباشرة.", event.threadID, event.messageID);
  }
};

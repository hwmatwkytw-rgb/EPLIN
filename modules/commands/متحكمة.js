module.exports = {
  config: {
    name: "متحكمة",
    version: "1.0.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 0,
    category: "ownr",
    guide: "بيخليك تنادي البوت باسمه وتنفذ الأوامر"
  },

  // الدالة دي بتشتغل مع كل رسالة بتوصل للبوت
  onChat: async function ({ api, event, args, threadsData, usersData, dashBoard }) {
    const { body, threadID, messageID, senderID } = event;
    if (!body) return;

    // كلمة السر اللي البوت حيتحرك لما يسمعها
    const botName = "إبلين";
    const input = body.toLowerCase();

    // التحقق لو الرسالة بتبدأ بكلمة "ابلين"
    if (input.startsWith(botName)) {
      
      // بنشيل كلمة "ابلين" وأي كلمات ربط زي "شغلي" أو "امسحي"
      let commandText = input
        .replace(botName, "")
        .replace("شغلي", "")
        .replace("فحي", "")
        .replace("امر", "")
        .trim();

      // بنقسم النص عشان نطلع اسم الأمر والـ args
      const cleanArgs = commandText.split(" ");
      const commandName = cleanArgs.shift(); // أول كلمة بعد "ابلين" حتكون اسم الأمر

      // بنفتش في لستة الأوامر اللي عندك في البوت
      const command = global.client.commands.get(commandName) || 
                      Array.from(global.client.commands.values()).find(cmd => cmd.config.aliases && cmd.config.aliases.includes(commandName));

      if (command) {
        // تفاعل سريع عشان المستخدم يعرف إن البوت سمع
        api.setMessageReaction("🦋", messageID, () => {}, true);

        try {
          // تنفيذ الأمر طوالي كأنك كتبته بالبادئة
          await command.onStart({
            api,
            event: { ...event, body: `${global.client.config.PREFIX}${commandName} ${cleanArgs.join(" ")}` }, // بنوهم البوت إن البادئة موجودة
            args: cleanArgs,
            threadsData,
            usersData,
            dashBoard
          });
        } catch (error) {
          console.error(error);
          api.sendMessage(`❌ | حصل مشكلة وأنا بحاول أشغل أمر ${commandName}`, threadID, messageID);
        }
      } else if (commandName === "منو" || commandName === "انتي") {
         api.sendMessage("مازا تريد ", threadID, messageID);
      }
    }
  }
};

module.exports = {
  config: {
    name: "مراقب_ابلين",
    version: "1.0.0",
    author: "AbuUbaida",
    category: "events"
  },

  onChat: async function ({ api, event, threadsData, usersData, dashBoard }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const input = body.toLowerCase().trim();
    const botName = "إبلين";

    if (input.startsWith(botName)) {
      let commandText = input.replace(botName, "").replace("شغلي", "").trim();
      if (!commandText) return;

      const args = commandText.split(" ");
      const commandName = args.shift();

      // بنجيب الأمر من "القاموس" بتاع البوت
      const command = global.client.commands.get(commandName) || 
                      Array.from(global.client.commands.values()).find(cmd => cmd.config.aliases && cmd.config.aliases.includes(commandName));

      if (command && commandName !== "إبلين") {
        try {
          api.setMessageReaction("🧞", messageID, () => {}, true);
          
          // هنا السر: بنشغل الأمر وكأن المستخدم كتبه بالبادئة فعلاً
          await command.onStart({
            api,
            event: { ...event, body: `${global.client.config.PREFIX}${commandName} ${args.join(" ")}` },
            args: args,
            threadsData,
            usersData,
            dashBoard
          });
        } catch (e) {
          console.log("Error in Listener:", e);
        }
      }
    }
  }
};

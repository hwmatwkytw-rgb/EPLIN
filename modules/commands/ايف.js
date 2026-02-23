const path = require('path');

module.exports = {
  config: {
    name: 'ايف',
    version: '1.0',
    author: 'Hridoy',
    countDown: 0,
    prefix: true,
    adminOnly: true,
    aliases: ['reload', 'cmdreload', 'ريلود'],
    description: 'إعادة تحميل أمر معين بدون إيقاف البوت',
    category: 'owner',
    guide: {
      ar: '{pn} [اسم الأمر]'
    },
  },

  onStart: async ({ args, event, api, config }) => {
    const { threadID, messageID, senderID } = event;
    
    // نظام حماية المالك
    const ownerID = "61588108307572";
    if (senderID !== ownerID) {
       return api.sendMessage("عذراً، هذا الأمر مخصص للمطور فقط.", threadID, messageID);
    }

    if (!args[0]) {
      return api.sendMessage("خطأ: يرجى كتابة اسم الأمر المراد تحديثه.", threadID, messageID);
    }

    const commandName = args[0].toLowerCase();
    const command = global.client.commands.get(commandName) || 
                    global.client.commands.get(global.client.aliases.get(commandName));

    if (!command) {
      return api.sendMessage(`فشل: الأمر [ ${commandName} ] غير موجود في ملفات البوت.`, threadID, messageID);
    }

    const folder = command.config.category || "";
    const filePath = path.join(__dirname, '..', folder, `${command.config.name}.js`);

    try {
      delete require.cache[require.resolve(filePath)];
      global.client.commands.delete(command.config.name);
      
      const newCommand = require(filePath);
      global.client.commands.set(newCommand.config.name, newCommand);

      return api.sendMessage(`تم تحديث الأمر [ ${newCommand.config.name} ] بنجاح وهو جاهز للعمل الآن.`, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`حدث خطأ أثناء إعادة التحميل: ${error.message}`, threadID, messageID);
    }
  },
};

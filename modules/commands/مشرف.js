const fs = require('fs-extra');

module.exports = {
  config: {
    name: 'مشرف',
    version: '2.1',
    author: 'Abu Obaida & Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    aliases: ['adm', 'ادمن', 'المشرفين'],
    description: 'إدارة وعرض قائمة مشرفين البوت',
    category: 'admin',
    guide: {
      ar: '{pn} [اضافة | ازالة | قائمة]'
    },
  },

  onStart: async ({ args, event, api, config }) => {
    const { threadID, messageID, senderID, mentions } = event;
    
    // محاولة الوصول لملف الإعدادات بأكثر من طريقة لضمان العمل
    const currentConfig = global.config || config || global.client.config;

    try {
      // 1. ميزة عرض القائمة (تم تحسينها)
      if (args[0] === 'قائمة' || !args[0]) {
        const adminIDs = currentConfig.adminUIDs || [];
        
        if (adminIDs.length === 0) {
          return api.sendMessage("ꕥ ┋ لا يوجد مشرفون مضافون حالياً.", threadID, messageID);
        }

        let msg = `╭━━━━〔 𓆩 👑 𓆪 〕━━━━╮\n┃\n`;
        msg += `┃ 𓆩 ꕥ 𓆪 قـائمة مـشرفي \n┃\n`;

        // جلب معلومات المستخدمين دفعة واحدة أسرع من جلبها واحد واحد
        const usersInfo = await api.getUserInfo(adminIDs).catch(() => ({}));
        
        for (let i = 0; i < adminIDs.length; i++) {
          const id = adminIDs[i];
          const name = usersInfo[id] ? usersInfo[id].name : "مستخدم فيسبوك";
          msg += `┃ 〖 ${i + 1} 〗ـ ${name}\n┃ 🆔 ${id}\n┃\n`;
        }
        
        msg += `╰━━━━━━━━━━━━━━━━━━━━╯`;
        return api.sendMessage(msg, threadID, messageID);
      }

      // التحقق من صلاحية المالك (ID الخاص بك)
      const ownerID = "61588108307572";
      if (senderID !== ownerID) {
         return api.sendMessage("ꕥ ┋ ❌ هـذا الـأمر مـخصص لـمالك الـبوت فـقط.", threadID, messageID);
      }

      const action = args[0].toLowerCase();
      let targetUID;

      if (mentions && Object.keys(mentions).length > 0) {
        targetUID = Object.keys(mentions)[0]; 
      } else if (args[1]) {
        targetUID = args[1];
      } else {
        return api.sendMessage("ꕥ ┋ ⚠️ يـرجى مـنشنة الـعضو أو كـتابة الـ ID.", threadID, messageID);
      }

      // 2. ميزة الإضافة
      if (action === 'add' || action === 'اضافة') {
        if (currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage("ꕥ ┋ ℹ️ هـذا الـعضو مـشرف بـالفعل.", threadID, messageID);
        }

        currentConfig.adminUIDs.push(targetUID);
        // تأكد من مسار ملف الكونسل الصحيح في بوتك
        fs.writeJsonSync('./config.json', currentConfig, { spaces: 2 });

        const successAdd = 
          `╭───〔 𓆩 ✅ تـم الـتـرقـيـة 𓆪 〕───╮\n` +
          `┃ ꕥ الـحالة: إضـافة مـشرف جـديد\n` +
          `┃ ꕥ الـآيدي: ${targetUID}\n` +
          `╰──────────────────╯`;
        return api.sendMessage(successAdd, threadID, messageID);

      } 
      // 3. ميزة الإزالة
      else if (action === 'remove' || action === 'ازالة') {
        if (!currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage("ꕥ ┋ ℹ️ هـذا الـعضو لـيس مـشرفاً.", threadID, messageID);
        }

        currentConfig.adminUIDs = currentConfig.adminUIDs.filter(id => id !== targetUID);
        fs.writeJsonSync('./config.json', currentConfig, { spaces: 2 });

        const successRemove = 
          `╭───〔 𓆩 🗑️ 𓆪 〕─╮\n` +
          `┃ ꕥ الـحالة: إزالـة مـن الـمشرفين\n` +
          `┃ ꕥ الـآيدي: ${targetUID}\n` +
          `╰────────────────╯`;
        return api.sendMessage(successRemove, threadID, messageID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage(`ꕥ ┋ ❌ حدث خطأ: ${error.message}`, threadID, messageID);
    }
  },
};

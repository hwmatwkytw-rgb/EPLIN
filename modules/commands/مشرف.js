const fs = require('fs-extra'); 

module.exports = {
  config: {
    name: 'مشرف',
    version: '2.0',
    author: ' & Abu Obaida',
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

  onStart: async ({ args, event, api }) => {
    const { threadID, messageID, senderID, mentions } = event;
    const currentConfig = global.client.config;

    try {
      // 1. ميزة عرض القائمة
      if (args[0] === 'قائمة' || !args[0]) {
        const adminIDs = currentConfig.adminUIDs;
        if (adminIDs.length === 0) return api.sendMessage("ꕥ ┋ لا يوجد مشرفون مضافون حالياً.", threadID);

        let msg = `╭━━━━〔 𓆩 👑 𓆪 〕━━━━╮\n┃\n`;
        msg += `┃ 𓆩 ꕥ 𓆪 قـائمة مـشرفي الـعرش\n┃\n`;
        
        for (let i = 0; i < adminIDs.length; i++) {
          const name = (await api.getUserInfo(adminIDs[i]))[adminIDs[i]].name;
          msg += `┃ 〖 ${i + 1} 〗ـ ${name}\n┃ 🆔 ${adminIDs[i]}\n┃\n`;
        }
        
        msg += `╰━━━━━━━━━━━━━━━━━━━━╯`;
        return api.sendMessage(msg, threadID, messageID);
      }

      // التحقق من صلاحية المالك للإضافة والحذف
      // ملاحظة: استبدل الـ ID هنا بآيدي المالك الخاص بك إذا لم تكن تستخدم دالة isOwner
      const owners = currentConfig.ownerUIDs || []; 
      if (!owners.includes(senderID) && senderID !== "61586897962846") {
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
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });

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
        fs.writeJsonSync('./config/config.json', currentConfig, { spaces: 2 });

        const successRemove = 
          `╭───〔 𓆩 🗑️ تـم الـإعـفـاء 𓆪 〕───╮\n` +
          `┃ ꕥ الـحالة: إزالـة مـن الـمشرفين\n` +
          `┃ ꕥ الـآيدي: ${targetUID}\n` +
          `╰──────────────────╯`;
        return api.sendMessage(successRemove, threadID, messageID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage("ꕥ ┋ ❌ حـدث خـطأ فـي إدارة الـصلاحيات.", threadID, messageID);
    }
  },
};

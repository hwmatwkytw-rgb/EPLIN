admin fs = require('fs-extra');

module.exports = {
  config: {
    name: 'مشرف',
    version: '3.0',
    author: 'Abu Obaida & Hridoy',
    countDown: 5,
    prefix: true,
    adminOnly: true,
    aliases: ['adm', 'ادمن', 'المشرفين'],
    description: 'إدارة طاقم إشراف كنجي كلاود',
    category: 'owner',
    guide: {
      ar: '{pn} [اضافة | ازالة | قائمة]'
    },
  },

  onStart: async ({ args, event, api, Users, config }) => {
    const { threadID, messageID, senderID, mentions } = event;
    const currentConfig = global.config || config;

    try {
      // --- 1. عرض القائمة بالستايل المودرن (رقم 2) ---
      if (args[0] === 'قائمة' || !args[0]) {
        const adminIDs = currentConfig.adminUIDs || [];
        
        if (adminIDs.length === 0) {
          return api.sendMessage("┌─── ⋆〖 ERROR 〗⋆ ───┐\n\n  ❌ لا يوجد مشرفين حالياً\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘", threadID, messageID);
        }

        let msg = `┌─── ⋆〖 ADMIN LIST 〗⋆ ───┐\n\n`;

        for (let i = 0; i < adminIDs.length; i++) {
          const id = adminIDs[i];
          let name;
          try {
            name = await Users.getNameUser(id);
          } catch (e) {
            const info = await api.getUserInfo(id).catch(() => null);
            name = info && info[id] ? info[id].name : "Unknown User";
          }
          
          const index = (i + 1).toString().padStart(2, '0'); // بيخلي الرقم 01, 02...
          msg += `  ● ${index} ➔ ${name}\n`;
          msg += `  ╰╼ 🆔: ${id}\n\n`;
        }
        
        msg += `└─── ⋆ ⚡ CLOUDS ⚡ ⋆ ───┘`;
        return api.sendMessage(msg, threadID, messageID);
      }

      // --- نظام حماية المالك (ID الخاص بك) ---
      const ownerID = "61588108307572";
      if (senderID !== ownerID) {
         return api.sendMessage("⚠️ ┋ هـذا الـبروتوكول مـخصص لـلمطور فـقط.", threadID, messageID);
      }

      const action = args[0].toLowerCase();
      let targetUID;

      // تحديد الهدف (رد، منشن، أو آيدي)
      if (mentions && Object.keys(mentions).length > 0) {
        targetUID = Object.keys(mentions)[0]; 
      } else if (args[1]) {
        targetUID = args[1];
      } else if (event.type === "message_reply") {
        targetUID = event.messageReply.senderID;
      }

      if (!targetUID) {
        return api.sendMessage("┌─── ⋆〖 𝑎𝑝𝑙𝑒𝑛 〗⋆ ───┐\n\n  ⚠️ حدد المستخدم المطلوب\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘", threadID, messageID);
      }

      // --- 2. الإضافة ---
      if (action === 'add' || action === 'اضافة') {
        if (currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage("● ℹ️ المستخدم مضاف مسبقاً في النظام.", threadID, messageID);
        }

        currentConfig.adminUIDs.push(targetUID);
        fs.writeJsonSync('./config.json', currentConfig, { spaces: 2 });

        return api.sendMessage(`┌─── ⋆〖 SUCCESS 〗⋆ ───┐\n\n  ✅ تم الترقية بنجاح\n  🆔: ${targetUID}\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘`, threadID, messageID);
      } 

      // --- 3. الإزالة ---
      else if (action === 'remove' || action === 'ازالة') {
        if (!currentConfig.adminUIDs.includes(targetUID)) {
          return api.sendMessage("● ℹ️ هذا المستخدم ليس لديه صلاحيات.", threadID, messageID);
        }

        currentConfig.adminUIDs = currentConfig.adminUIDs.filter(id => id !== targetUID);
        fs.writeJsonSync('./config.json', currentConfig, { spaces: 2 });

        return api.sendMessage(`┌─── ⋆〖 REMOVED 〗⋆ ───┐\n\n  🗑️ تم سحب الصلاحيات\n  🆔: ${targetUID}\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘`, threadID, messageID);
      }

    } catch (error) {
      api.sendMessage(`❌ System Error: ${error.message}`, threadID, messageID);
    }
  },
};

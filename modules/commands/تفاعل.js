const fs = require('fs-extra');
const path = require('path');

const groupsPath = path.join(__dirname, '../../database/groups.json');

module.exports = {
  config: {
    name: "تفاعل",
    version: "1.0.0",
    author: "Kenji",
    countDown: 5,
    role: 1,
    description: "تفعيل أو تعطيل نظام التفاعل التلقائي مع الرسائل",
    category: "ownr",
    guide: { ar: "{pn} تشغيل | {pn} اطفاء" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const action = args[0];

    if (!action || !['تشغيل', 'اطفاء', 'حالة'].includes(action)) {
      return api.sendMessage(
`●─────── ⌬ ───────●
┇ ⦿ ⟬ نـظـام الـتـفـاعـل ⟭
┇
┇ الـطـريـقـة:
┇ • .تفاعل تشغيل
┇ • .تفاعل اطفاء
┇ • .تفاعل حالة
┇
┇ الـوصـف: البوت يتفاعل مع
┇ رسائل الأعضاء تلقائياً 💬
●─────── ⌬ ───────●`,
        threadID, messageID
      );
    }

    let groups = {};
    try { groups = await fs.readJson(groupsPath); } catch (e) { groups = {}; }

    if (!groups[threadID]) groups[threadID] = { settings: {} };
    if (!groups[threadID].settings) groups[threadID].settings = {};

    if (action === 'حالة') {
      const isOn = groups[threadID].settings.autoReact === true;
      return api.sendMessage(
`●─────── ⌬ ───────●
┇ ⦿ ⟬ حـالـة الـتـفـاعـل ⟭
┇
┇ الـوضـع: ${isOn ? '✅ مـفـعـل' : '❌ مـعـطـل'}
●─────── ⌬ ───────●`,
        threadID, messageID
      );
    }

    if (action === 'تشغيل') {
      groups[threadID].settings.autoReact = true;
      await fs.writeJson(groupsPath, groups, { spaces: 2 });
      return api.sendMessage(
`●─────── ⌬ ───────●
┇ ⦿ ⟬ نـظـام الـتـفـاعـل ⟭
┇
┇ الـحـالـة: ✅ تـم الـتـفـعـيـل
┇ الـوصـف: البوت سيتفاعل الآن
┇ مع رسائل الأعضاء تلقائياً
●─────── ⌬ ───────●`,
        threadID, messageID
      );
    }

    if (action === 'اطفاء') {
      groups[threadID].settings.autoReact = false;
      await fs.writeJson(groupsPath, groups, { spaces: 2 });
      return api.sendMessage(
`●─────── ⌬ ───────●
┇ ⦿ ⟬ نـظـام الـتـفـاعـل ⟭
┇
┇ الـحـالـة: ❌ تـم الـتـعـطـيـل
┇ الـوصـف: لن يتفاعل البوت
┇ بعد الآن مع الرسائل
●─────── ⌬ ───────●`,
        threadID, messageID
      );
    }
  }
};

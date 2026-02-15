const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEV_ID = '61586897962846';
const COMMANDS_PATH = __dirname;

let fileCache = {};

// ==========================
// تغليف تلقائي لبنية البوت
// ==========================
function wrapToBotStructure(code, commandName) {
  if (code.includes('module.exports')) return code;

  return `
module.exports = {
  config: {
    name: '${commandName}',
    version: '1.0',
    author: 'AutoFixed by Abu Ubaida',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'أمر تم تعديله تلقائياً ليتوافق مع بنية البوت',
    category: 'auto'
  },

  onStart: async ({ api, event, args }) => {
    try {
${code.split('\n').map(line => '      ' + line).join('\n')}
    } catch (err) {
      return api.sendMessage('❌ خطأ: ' + err.message, event.threadID, event.messageID);
    }
  }
};
`;
}

// ==========================
// استخراج اسم المكتبة من الخطأ
// ==========================
function extractMissingModule(errorMessage) {
  const match = errorMessage.match(/Cannot find module '(.*?)'/);
  return match ? match[1] : null;
}

module.exports = {
  config: {
    name: 'ايف',
    version: '6.0',
    author: 'Hridoy | Advanced by Abu Ubaida',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'مدير أوامر متكامل + تثبيت مكتبات + إصلاح تلقائي',
    category: 'owner',
    guide: {
      ar:
        '📂 {pn} → عرض الملفات\n' +
        '📄 {pn} <رقم> → عرض محتوى ملف\n' +
        '🆕 {pn} انشئ <اسم> (رد على كود)\n' +
        '♻️ {pn} استبدل <اسم> (رد على كود)\n' +
        '🗑 {pn} حذف <اسم>\n' +
        '🔄 {pn} ريلود <اسم>\n' +
        '📦 {pn} ثبت <مكتبة>'
    }
  },

  onStart: async ({ api, event, args, config }) => {
    const { threadID, messageID, senderID } = event;
    const adminUIDs = config.adminUIDs || [];

    if (!adminUIDs.includes(senderID))
      return api.sendMessage('❌ الأمر خاص بالمطور فقط.', threadID, messageID);

    const files = fs.readdirSync(COMMANDS_PATH).filter(f => f.endsWith('.js'));

    // =========================
    // عرض كل الملفات
    // =========================
    if (!args[0]) {
      if (!files.length)
        return api.sendMessage('❌ لا توجد ملفات.', threadID, messageID);

      let msg = '📂 ملفات الأوامر:\n\n';
      files.forEach((file, index) => {
        msg += `${index + 1}️⃣ ${file}\n`;
      });

      fileCache[threadID] = files;
      return api.sendMessage(msg, threadID, messageID);
    }

    // =========================
    // عرض ملف برقم
    // =========================
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (!fileCache[threadID] || !fileCache[threadID][index])
        return api.sendMessage('❌ رقم غير صحيح.', threadID, messageID);

      const fileName = fileCache[threadID][index];
      const filePath = path.join(COMMANDS_PATH, fileName);
      const content = fs.readFileSync(filePath, 'utf8');

      return api.sendMessage(
        `📄 ${fileName}\n\n${content.substring(0, 15000)}`,
        threadID,
        messageID
      );
    }

    const action = args[0];
    const commandName = args[1];
    const filePath = path.join(COMMANDS_PATH, `${commandName}.js`);

    // =========================
    // تثبيت مكتبة (Render compatible)
    // =========================
    if (action === 'ثبت') {
      const pkg = commandName;
      if (!pkg)
        return api.sendMessage('❌ اكتب اسم المكتبة.', threadID, messageID);

      try {
        execSync(`npm install ${pkg} --save`, { stdio: 'inherit' });

        return api.sendMessage(
          `✅ تم تثبيت ${pkg} بنجاح.\n♻️ جاري إعادة تشغيل البوت...`,
          threadID,
          messageID,
          () => process.exit(1)
        );

      } catch (err) {
        return api.sendMessage(`❌ فشل التثبيت:\n${err.message}`, threadID, messageID);
      }
    }

    // =========================
    // إنشاء أمر ذكي
    // =========================
    if (action === 'انشئ') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على رسالة فيها الكود.', threadID, messageID);

      if (!commandName)
        return api.sendMessage('❌ اكتب اسم الأمر.', threadID, messageID);

      if (fs.existsSync(filePath))
        return api.sendMessage('❌ الملف موجود مسبقاً.', threadID, messageID);

      let code = wrapToBotStructure(event.messageReply.body, commandName);
      fs.writeFileSync(filePath, code, 'utf8');

      return api.sendMessage(
        `✅ تم إنشاء ${commandName}.js\n♻️ جاري إعادة التشغيل...`,
        threadID,
        messageID,
        () => process.exit(1)
      );
    }

    // =========================
    // استبدال أمر
    // =========================
    if (action === 'استبدل') {
      if (!event.messageReply?.body)
        return api.sendMessage('❌ لازم ترد على رسالة فيها الكود الجديد.', threadID, messageID);

      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      let code = wrapToBotStructure(event.messageReply.body, commandName);
      fs.writeFileSync(filePath, code, 'utf8');

      return api.sendMessage(
        `✅ تم استبدال ${commandName}.js\n♻️ جاري إعادة التشغيل...`,
        threadID,
        messageID,
        () => process.exit(1)
      );
    }

    // =========================
    // حذف أمر
    // =========================
    if (action === 'حذف') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      fs.unlinkSync(filePath);

      return api.sendMessage(
        `🗑 تم حذف ${commandName}.js\n♻️ جاري إعادة التشغيل...`,
        threadID,
        messageID,
        () => process.exit(1)
      );
    }

    // =========================
    // ريلود + كشف مكتبات ناقصة
    // =========================
    if (action === 'ريلود') {
      if (!fs.existsSync(filePath))
        return api.sendMessage('❌ الملف غير موجود.', threadID, messageID);

      delete require.cache[require.resolve(filePath)];

      try {
        require(filePath);
        return api.sendMessage(`🔄 تم تحميل ${commandName}.js بنجاح.`, threadID, messageID);
      } catch (err) {

        const missing = extractMissingModule(err.message);

        if (missing) {
          return api.sendMessage(
            `❌ مكتبة ناقصة: ${missing}\n💡 ثبتها بالأمر:\nايف ثبت ${missing}`,
            threadID,
            messageID
          );
        }

        return api.sendMessage(`❌ خطأ في الكود:\n${err.message}`, threadID, messageID);
      }
    }

    return api.sendMessage('❌ أمر غير معروف.', threadID, messageID);
  }
};

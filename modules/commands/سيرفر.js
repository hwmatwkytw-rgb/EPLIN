const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "سيرفر",
    version: "1.0",
    author: "bestgamershk",
    countDown: 5,
    prefix: true,
    adminOnly: true, // تأكد من تفعيلها إذا كنت تريد حصرها للمدراء
    category: "المطور",
    description: "إعادة تعيين (حذف) جميع إعدادات المجموعة.",
    guide: {
      ar: "{pn} resetsettings"
    },
  },

  onStart: async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;

    // ملاحظة: التحقق من UID المطور يعتمد على ملف الـ config العام للبوت
    // إذا كان البوت يدعم adminOnly: true في الـ config أعلاه فسيقوم بالمهمة تلقائياً

    if (args[0] === "resetsettings") {
      return api.sendMessage("⚠️ هل أنت متأكد من إعادة تعيين جميع إعدادات هذه المجموعة؟\nرد بـ « نعم » للتأكيد.", threadID, (err, info) => {
        // إضافة الرد لمصفوفة الانتظار
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "confirm_reset"
        });
      }, messageID);
    }

    return api.sendMessage("❓ استخدم: « سيرفر resetsettings » لإعادة تعيين الإعدادات.", threadID, messageID);
  },

  onReply: async function({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;

    // التحقق من أن الشخص الذي رد هو نفس الشخص الذي طلب الأمر
    if (senderID !== handleReply.author) return;

    if (handleReply.type === "confirm_reset") {
      const confirmationWords = ["نعم", "yes", "تاكيد", "تأكيد"];
      
      if (confirmationWords.includes(body.toLowerCase())) {
        const dbPath = path.join(__dirname, '../../database/groups.json');

        try {
          if (!fs.existsSync(dbPath)) {
             return api.sendMessage("❌ ملف قاعدة البيانات غير موجود.", threadID, messageID);
          }

          let db = fs.readJsonSync(dbPath);

          if (db[threadID]) {
            // تصفير الإعدادات
            db[threadID].settings = {}; 
            fs.writeJsonSync(dbPath, db, { spaces: 2 });
            
            api.sendMessage("✅ تم إعادة تعيين جميع إعدادات المجموعة بنجاح.", threadID, messageID);
          } else {
            api.sendMessage("❌ لا توجد بيانات مسجلة لهذه المجموعة في القاعدة.", threadID, messageID);
          }
        } catch (e) {
          console.error(e);
          api.sendMessage("❌ حدث خطأ تقني أثناء محاولة مسح البيانات.", threadID, messageID);
        }
      } else {
        api.sendMessage("❌ تم إلغاء العملية بناءً على ردك.", threadID, messageID);
      }

      // حذف رسالة التأكيد بعد الرد لتنظيف الشات
      api.unsendMessage(handleReply.messageID);
    }
  }
};

const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "ادارة",
    version: "1.0.1",
    author: "GrandpaEJ",
    countDown: 5,
    hasPermssion: 1, 
    description: "نظام إدارة المجموعات الكامل باللغة العربية",
    category: "group",
    usePrefix: true,
    guide: {
        en: "{pn} [الأمر الفرعي]"
    }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, messageReply, senderID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(e => e.id === senderID);
      
      if (!isAdmin) {
        return api.sendMessage("⚠️ عذراً، يجب أن تكون مسؤولاً (Admin) في المجموعة لاستخدام هذا الأمر.", threadID, messageID);
      }

      if (args.length === 0) {
        return api.sendMessage(
          "📝 𝗤𝗨𝗜𝗖𝗞 𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗥\n\n" +
          "1. ادارة رمز [الرمز] - تغيير رمز المجموعة\n" +
          "2. ادارة اسم [الاسم] - تغيير اسم المجموعة\n" +
          "3. ادارة صورة - تغيير الصورة (رد على صورة)\n" +
          "4. ادارة جلب - استخراج صورة المجموعة الحالية\n" +
          "5. ادارة معلومات - عرض تفاصيل المجموعة\n" +
          "6. ادارة مسؤول [اضافة/حذف] [@تاغ] - إدارة المسؤولين\n" +
          "7. ادارة موافقة [تشغيل/ايقاف] - وضع الموافقة على الأعضاء",
          threadID, messageID
        );
      }

      // تحويل أول كلمة (الأمر الفرعي) لمتغير
      const command = args[0].toLowerCase();
      const params = args.slice(1).join(" ");
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

      // --- بداية معالجة الأوامر باللغة العربية ---
      switch (command) {
        
        case "رمز": { // بديل emoji
          if (!params) return api.sendMessage("⚠️ يرجى إدخال الرمز التعبيري الجديد بعد الكلمة.", threadID, messageID);
          await api.changeThreadEmoji(params, threadID);
          break;
        }

        case "اسم": { // بديل name
          if (!params) return api.sendMessage("⚠️ يرجى إدخال اسم المجموعة الجديد.", threadID, messageID);
          await api.setTitle(params, threadID);
          break;
        }

        case "صورة": { // بديل setpic
          if (!messageReply || !messageReply.attachments || !messageReply.attachments[0]) {
            return api.sendMessage("⚠️ يرجى الرد بصورة (Reply) واكتب 'ادارة صورة'.", threadID, messageID);
          }
          const imgUrl = messageReply.attachments[0].url;
          const imgPath = path.join(cachePath, `group_${threadID}.png`);
          const imgResponse = await axios.get(imgUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(imgPath, Buffer.from(imgResponse.data));
          await api.changeGroupImage(fs.createReadStream(imgPath), threadID);
          fs.unlinkSync(imgPath);
          break;
        }

        case "جلب": { // بديل getpic
          if (!threadInfo.imageSrc) return api.sendMessage("⚠️ هذه المجموعة لا تملك صورة خاصة.", threadID, messageID);
          const imgPath = path.join(cachePath, `getpic_${threadID}.png`);
          const imgResponse = await axios.get(threadInfo.imageSrc, { responseType: "arraybuffer" });
          fs.writeFileSync(imgPath, Buffer.from(imgResponse.data));
          await api.sendMessage({ 
            body: "🖼️ صورة المجموعة الحالية:",
            attachment: fs.createReadStream(imgPath)
          }, threadID, () => fs.unlinkSync(imgPath));
          break;
        }

        case "معلومات": { // بديل info
          const adminList = threadInfo.adminIDs.map(admin => `• ${threadInfo.nicknames[admin.id] || "مستخدم فيسبوك"}`).join("\n");
          const infoMsg = 
            "📊 تفاصيل المجموعة:\n\n" +
            `• الاسم: ${threadInfo.threadName || "غير محدد"}\n` +
            `• المعرف: ${threadInfo.threadID}\n` +
            `• الأعضاء: ${threadInfo.participantIDs.length}\n` +
            `• المسؤولين: ${threadInfo.adminIDs.length}\n` +
            `• الرمز: ${threadInfo.emoji || "الافتراضي"}\n` +
            "👑 المسؤولون حالياً:\n" + adminList;
          return api.sendMessage(infoMsg, threadID, messageID);
        }

        case "موافقة": { // بديل approval
          const state = params.toLowerCase();
          if (state === "تشغيل") await api.changeGroupApprovalMode(threadID, true);
          else if (state === "ايقاف") await api.changeGroupApprovalMode(threadID, false);
          else return api.sendMessage("⚠️ يرجى كتابة [تشغيل] أو [ايقاف].", threadID, messageID);
          break;
        }

        case "مسؤول": { // بديل admin
          const action = args[1];
          const mentions = Object.keys(event.mentions);
          if (!action || !mentions.length) return api.sendMessage("⚠️ مثال: ادارة مسؤول اضافة @اسم_الشخص", threadID, messageID);
          
          let isAdd = (action === "اضافة" || action === "إضافة");
          for (const userID of mentions) {
            await api.changeAdminStatus(threadID, userID, isAdd);
          }
          break;
        }

        default: {
          return api.sendMessage("⚠️ أمر غير صحيح. اكتب (ادارة) فقط لرؤية الأوامر المتاحة.", threadID, messageID);
        }
      }

      // رسالة تأكيد النجاح لجميع الأوامر ما عدا العرض
      if (command !== "معلومات" && command !== "جلب") {
        api.sendMessage(`✅ تم تنفيذ طلبك بنجاح في قسم [${command}].`, threadID, messageID);
      }

    } catch (error) {
      api.sendMessage(`❌ حدث خطأ: ${error.message}`, threadID, messageID);
    }
  }
};

const { addReply, removeReply } = require("../data/replice");

module.exports = {
  config: {
    name: "ردود",
    aliases: ["reply", "الردود"],
    version: "1.0.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 1, // رتبة الإدارة (أدمن البوت ومطوريه)
    category: "ay"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();
    
    // لو ما كتب أكشن (أضف أو حذف)
    if (!action) {
      return api.sendMessage("✾ ┇ حـدد الإجـراء الـمطلوب: [ اضف | حذف ]", threadID, messageID);
    }
    
    // --- قـسم الإضـافة ---
    if (action === "اضف" || action === "أضف") {
      // بناخد الكلام اللي بعد كلمة "اضف" ونقسمه بـ |
      const content = args.slice(1).join(" ").split("|").map(t => t.trim());
      const trigger = content[0];
      const response = content[1];

      if (!trigger || !response) {
        return api.sendMessage("✾ ┇ الـصـيغة: ردود اضف [الكلمة] | [الرد]", threadID, messageID);
      }
      
      try {
        await addReply(trigger, response);
        return api.sendMessage(`✅ تم إضافة الرد بنجاح:\n- الكلمة: ${trigger}\n- الرد: ${response}`, threadID, messageID);
      } catch (e) {
        return api.sendMessage(`✾ ┇ حصل خطأ أثناء الإضافة!`, threadID, messageID);
      }

    // --- قـسم الـحذف ---
    } else if (action === "حذف") {
      const trigger = args.slice(1).join(" ").trim();
      
      if (!trigger) {
        return api.sendMessage("✾ ┇ الـصـيغة: ردود حذف [الكلمة]", threadID, messageID);
      }
      
      try {
        await removeReply(trigger);
        return api.sendMessage(`✅ تم حذف الرد الخاص بـ "${trigger}"`, threadID, messageID);
      } catch (err) {
        return api.sendMessage(`✾ ┇ ${err.message}`, threadID, messageID);
      }

    } else {
      return api.sendMessage("✾ ┇ خـيار غـير مـعروف، اسـتخدم (اضف) أو (حذف).", threadID, messageID);
    }
  }
};

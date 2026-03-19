const axios = require("axios");

module.exports = {
  config: {
    name: "كنيات",
    aliases: ["بانيسه", "كنية"],
    version: "2.0.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 0, // جرب خليه 0 هسي عشان تتأكد إنه شغال معاك
    category: "المجموعة"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    if (args.length === 0) {
      return api.sendMessage(`✾ ┇ الصيغة: كنيات عام [ الاسم ] الجنس`, threadID, messageID);
    }

    // تغيير كنية البوت
    if (args[0] === "bot") {
      api.setMessageReaction("✨", messageID, () => {}, true);
      return api.changeNickname("ابلين", threadID, api.getCurrentUserID());
    }

    // تغيير كنيات المجموعة
    if (args[0] === "عام") {
      const template = args.slice(1).join(" ");
      if (!template.includes("الاسم")) return api.sendMessage("✾ ┇ اكتب (الاسم) في القالب", threadID);

      try {
        const info = await api.getThreadInfo(threadID);
        // هنا التعديل: نستخدم participantIDs لو userInfo ما اشتغلت
        const members = info.participantIDs;
        
        api.sendMessage(`✾ ┇ جاري التغيير لـ ${members.length} عضو...`, threadID);

        for (let id of members) {
          if (id === api.getCurrentUserID()) continue;
          
          // جلب الاسم
          const userData = await api.getUserInfo(id);
          const name = userData[id].firstName || userData[id].name || "User";
          
          // تحويل بسيط للاسم (عشان ما يعلق)
          let finalNickname = template.replace("الاسم", name);
          
          await api.changeNickname(finalNickname, threadID, id);
          await new Promise(resolve => setTimeout(resolve, 1000)); // تأخير ثانية
        }
        return api.sendMessage("✾ ┇ تم بنجاح ✅", threadID);
      } catch (e) {
        return api.sendMessage("✾ ┇ حصل خطأ في جلب البيانات", threadID);
      }
    }
  }
};

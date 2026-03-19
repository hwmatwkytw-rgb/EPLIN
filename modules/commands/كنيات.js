module.exports = {
  config: {
    name: "كنيات",
    aliases: ["بانيسه", "كنية"],
    version: "2.5.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 0,
    category: "المجموعة"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // لو ما كتب أي حاجة بعد الأمر
    if (args.length === 0) {
      return api.sendMessage(`✾ ┇ الصيغة: كنيات عام [ الاسم ] الجنس`, threadID, messageID);
    }

    // 1. خيار البوت (لو أول كلمة هي bot)
    if (args[0].toLowerCase() === "bot") {
      api.setMessageReaction("✨", messageID, () => {}, true);
      return api.changeNickname("ابلين", threadID, api.getCurrentUserID());
    }

    // 2. خيار المجموعة (بقى يدعم لو كتبت "عام" أو دخلت في القالب طوالي)
    let template = args.join(" ");
    if (template.startsWith("عام ") || template.startsWith("gc ")) {
        template = args.slice(1).join(" "); // شيل كلمة "عام" وخد الباقي
    }

    if (!template.includes("الاسم")) {
      return api.sendMessage("✾ ┇ لازم القالب يحتوي على كلمة (الاسم) يا ملك!", threadID, messageID);
    }

    try {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs;
      
      api.sendMessage(`✾ ┇ أبشر، جاري تغيير كنيات ${members.length} عضو...`, threadID);

      for (let id of members) {
        if (id === api.getCurrentUserID()) continue;
        
        try {
          const userData = await api.getUserInfo(id);
          const name = userData[id].firstName || userData[id].name || "User";
          const gender = userData[id].gender; // 1 للأنثى، 2 للذكر
          
          let emoji = (gender == 1) ? "🚺" : (gender == 2) ? "🚹" : "🚻";
          
          let finalNickname = template
            .replace(/الاسم/g, name)
            .replace(/الجنس/g, emoji);
          
          await api.changeNickname(finalNickname, threadID, id);
          // تأخير بسيط عشان الحظر
          await new Promise(r => setTimeout(r, 800)); 
        } catch (e) { continue; }
      }
      return api.sendMessage("✾ ┇ تم تغيير كنيات المجموعة بنجاح ✅", threadID);
    } catch (e) {
      return api.sendMessage("✾ ┇ فشل الوصول لبيانات الأعضاء، تأكد إني مسؤول!", threadID);
    }
  }
};

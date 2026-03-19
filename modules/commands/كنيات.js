const fs = require('fs-extra');
const path = require('path');

// دالة مساعدة لإنشاء تأخير (700 ملي ثانية بين كل تغيير كنية عشان الحظر)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// دالة تحويل الأسماء إلى العربية
function toArabicName(name) {
  if (!name) return "";
  let text = name.toLowerCase();
  const complexMap = {
    'th': 'ث', 'sh': 'ش', 'ch': 'تْش', 'ph': 'ف', 'gh': 'غ', 
    'oo': 'و', 'ee': 'ي', 'ay': 'ي', 'ie': 'ي', 'ue': 'و', 'qu': 'كْو',
    'ce': 'س', 'ci': 'س', 'cy': 'س', 'ge': 'ج', 'gi': 'ج', 'gy': 'ج',
  };
  for (const [key, value] of Object.entries(complexMap)) {
    text = text.replace(new RegExp(key, 'g'), value);
  }
  const simpleMap = {
    'a': 'ا', 'e': 'ي', 'i': 'ي', 'o': 'و', 'u': 'و', 'y': 'ي', 
    'b': 'ب', 'c': 'ك', 'd': 'د', 'f': 'ف', 'g': 'ج', 'h': 'هـ',
    'j': 'ج', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'p': 'ب',
    'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت', 'v': 'ف', 'w': 'و',
    'x': 'كس', 'z': 'ز', ' ': ' ', '-': '-',
  };
  return text.split("").map(c => simpleMap[c] || c).join("");
}

// دالة لإضافة رمز الجنس
function getGenderEmoji(gender) {
  if (!gender) return "";
  const g = String(gender).toLowerCase();
  if (g == "2" || g === "male") return "🚹"; // في بعض نسخ الـ FCA الرقم 2 يعني ذكر
  if (g == "1" || g === "female") return "🚺"; // الرقم 1 يعني أنثى
  return "🚻";
}

module.exports = {
  config: {
    name: "كنيات",
    aliases: ["بانيسه", "كنية"],
    version: "1.5.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 2, // للمطور فقط كما طلبت
    category: "المجموعة"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    if (args.length === 0) {
      return api.sendMessage(
        `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ الـصـيـغـة:\n✾ ┇ كنيات bot (لتغيير اسم البوت)\n✾ ┇ كنيات عام <القالب>\n✾ ┇ مثال: كنيات عام [ الاسم ] الجنس\n●───── ✾ ⌬ ✾ ─────●`,
        threadID, messageID
      );
    }

    // 1. تغيير كنية البوت
    if (args[0] === "bot") {
      const newNickname = global.client.config.name || "ابلين";
      try {
        const botID = api.getCurrentUserID();
        await api.changeNickname(newNickname, threadID, botID);
        return api.setMessageReaction("✨", messageID, () => {}, true);
      } catch (err) {
        return api.sendMessage(`✾ ┇ فشل تغيير كنية البوت.`, threadID, messageID);
      }
    }

    // 2. تغيير كنيات أعضاء المجموعة (عام)
    if (args[0] === "gc" || args[0] === "عام") {
      const template = args.slice(1).join(" ");
      if (!template || !template.includes("الاسم")) {
        return api.sendMessage(`✾ ┇ يجب أن يحتوي القالب على كلمة (الاسم).`, threadID, messageID);
      }
      
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.participantIDs;
        const botID = api.getCurrentUserID();
        
        api.setMessageReaction("🧭", messageID, () => {}, true);
        
        for (const userID of members) {
          if (userID === botID) continue; 
          
          // جلب بيانات العضو
          const userInfo = await api.getUserInfo(userID);
          const user = userInfo[userID];
          
          const fullName = user.name || "User";
          const firstName = toArabicName(fullName.split(" ")[0]);
          const genderEmoji = getGenderEmoji(user.gender);
          
          const finalNickname = template
            .replace(/الاسم/g, firstName)
            .replace(/الجنس/g, genderEmoji);
          
          try {
            await api.changeNickname(finalNickname, threadID, userID);
            await sleep(700); // تأخير عشان فيسبوك ما يحظر البوت
          } catch (e) { console.error("Error setting nickname for " + userID); }
        }
        
        return api.sendMessage(
          `●───── ✾ ⌬ ✾ ─────●\n✾ ┇ تـم تـطـبـيـق الـكـنـيـات بـنـجـاح ✅\n●───── ✾ ⌬ ✾ ─────●`,
          threadID
        );
        
      } catch (err) {
        console.error(err);
        return api.sendMessage(`✾ ┇ فشل تعديل الكنيات، تأكد من صلاحيات البوت.`, threadID, messageID);
      }
    }
  }
};

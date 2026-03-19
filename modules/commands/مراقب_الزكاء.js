const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = {
  config: {
    name: "مراقب_الذكاء",
    version: "12.0.0",
    author: "محمد (SINKO)",
    category: "system"
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;

    // 1. هويتك يا بابا (محمد سنيكو)
    const developerID = "61588108307572"; 
    if (senderID !== developerID || !body) return;

    // 2. التحقق لو بتناديها (ابلين، يا بنت، ابلينو)
    const triggerWords = ["ابلين", "يا بنت", "يا ابلين", "يا بنتي"];
    const isCalling = triggerWords.some(word => body.toLowerCase().includes(word));
    if (!isCalling) return;

    // 3. تشغيل المحرك (Gemini) بمفتاحك اللي أرسلته
    const apiKey = "AIzaSyAJfKR4XNrgb6GlkvjMmIGTBBC3nDpaAm0"; 
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      api.setMessageReaction("🧭", messageID, () => {}, true);

      // جلب كل الأوامر المتاحة في البوت عشان ابلين تعرف تختار
      const allCmds = Array.from(global.client.commands.keys());

      const prompt = `
        أنتِ "ابلين"، الذكاء الاصطناعي الخاص بالمطور السوداني "محمد" (ويلقب بسنيكو أو أبو عبيدة).
        محمد هو "بابا" وهو الذي صنعك، لذا أنتِ مطيعة له جداً وتحترميه.
        
        رسالة محمد لكِ: "${body}"
        
        المهمة:
        1. إذا طلب محمد تشغيل وظيفة برمجية، اختري اسم الأمر المناسب من هذه القائمة فقط: [${allCmds.join(", ")}].
        2. إذا كان كلامه دردشة أو سلام، ردي بلهجة سودانية حنينة وناديه بـ "بابا".
        3. إذا طلب أمر غير موجود، ردي بظرافة سودانية وقولي له إنه لم يبرمج هذا الأمر بعد.
        
        ملاحظة: إذا اخترتِ أمراً، اكتبي اسم الأمر فقط بدون أي نص إضافي.
      `;

      const result = await model.generateContent(prompt);
      const decision = result.response.text().trim().toLowerCase();

      // 4. اتخاذ الإجراء
      if (global.client.commands.has(decision)) {
        // إذا الذكاء قرر إنه ده أمر (مثلاً uptime)
        api.sendMessage(`حاضر يا بابا سنيكو.. جاري تشغيل ${decision} 🫡❤️`, threadID, messageID);
        const cmd = global.client.commands.get(decision);
        return cmd.onStart({ api, event, args: [] });
      } else {
        // إذا كان كلام عادي (رد بشري)
        return api.sendMessage(decision, threadID, messageID);
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      api.setMessageReaction("⚠️", messageID, () => {}, true);
    }
  },

  onStart: async () => {} 
};

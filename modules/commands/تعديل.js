const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "تعديل",
    aliases: ["edit", "draw"],
    version: "2.5",
    author: "AYOUB",
    description: "تعديل وتحسين الصور بالذكاء الاصطناعي",
    countDown: 10,
    prefix: true,
    category: "ai"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    // التأكد من الرد على صورة
    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ⚠️ يجب الرد على صورة لتعديلها\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  💡 اكتب الوصف بعد الأمر\n  مثال: تعديل جعلها في الفضاء\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", threadID, messageID);
    }

    api.setMessageReaction("🎨", messageID, () => {}, true);

    const waitingMsg = await api.sendMessage(
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ جـاري الـتـعديـل ✨

  •——◤ 🛠️ الأداة : AI Engine ◥——•
──────────────────
  •——◤ ⏳ الـحالة : قيد المعالجة ◥——•
      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`, threadID);

    try {
      const imageUrl = encodeURIComponent(event.messageReply.attachments[0].url);
      
      // استخدام API مستقر يعتمد على الصور المرجعية
      // هذا الرابط يقوم بدمج الوصف مع الصورة المرجعية
      const editUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?ref=${imageUrl}&width=1024&height=1024&nologo=true`;

      const path = __dirname + `/cache/edit_${Date.now()}.png`;
      const response = await axios.get(editUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(path, Buffer.from(response.data));

      api.unsendMessage(waitingMsg.messageID);

      return api.sendMessage({
        body: 
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ تـم الـتـعديـل بـنـجـاح ✨

  •——◤ 🖼️ الـحالة : نـجـاح ◥——•
──────────────────
  •——◤ 👤 الـطلب : ${prompt} ◥——•
      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (error) {
      console.error(error);
      api.editMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ❌ عذراً، الـ API لا يستجيب حالياً\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", waitingMsg.messageID);
    }
  }
};

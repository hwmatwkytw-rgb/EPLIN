const axios = require("axios");

module.exports = {
  config: {
    name: "معلومات",
    version: "1.2",
    author: "مصطفى ",
    countDown: 3,
    role: 1,
    description: "يعرض معلومات المطور بزخرفة المسار الطولي الفخمة.",
    category: "fun",
    guide: { ar: "اكتب المطور لعرض معلومات المطور" }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    // إضافة التفاعل بالفراشة 🦋
    api.setMessageReaction("🦋", messageID, (err) => {}, true);

    const infoText = `●───── ⌬ ─────●
┇ ⦿ ⟬ مـعـلـومـات الـمـطـوࢪ ⟭
┇
┇  الإســــــم:  مصطفى 
┇  الـلـقـــــب: sakran 
┇  الـعـمـــــر: 20 عاماً
┇  الـبـادئـة: [ ! ]
┇
┝━━━━━━━━━━━━━━━
┇ ⦿ ⟬ الـتـواصـل الـرسـمـي ⟭
┇
┇  فـيـسـبـوك: 
┇ https://www.facebook.com/flstyn.hrh.57955
┇
┝━━━━━━━━━━━━━━━
┇ ⦿ ⟬ الـخـبـرات ⟭
┇
┇ ⬩ برمجة وتطوير بوتات فيسبوك ♧
┇ ⬩ تصميم واجهات وأنظمة برمجية
┇
●───── ⌬ ─────●
 ⠇اسـتـمـتـع بـالـبـوت 〖 Ꮪ.ᎥᏁᏦᎧ 〗`;

    const imageURL = "https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg";

    try {
      const imgStream = (await axios.get(imageURL, { responseType: "stream" })).data;

      return api.sendMessage(
        {
          body: infoText,
          attachment: imgStream
        },
        threadID,
        messageID
      );
    } catch (err) {
      console.error("Developer info error:", err);
      return api.sendMessage("●───── ⌬ ─────●\n┇ خطأ في تحميل صورة المطور.\n●───── ⌬ ─────●", threadID, messageID);
    }
  }
};

const fs = require('fs-extra');
const path = require('path');

const groupsPath = path.join(__dirname, '../../database/groups.json');

module.exports = {
  config: {
    name: 'autoReact',
    version: '2.0',
    author: 'Kenji',
    eventType: ['message', 'message_reply']
  },

  onStart: async ({ event, api }) => {
    try {
      if (event.type !== 'message' && event.type !== 'message_reply') return;
      if (!event.body || event.body.trim() === '') return;

      const { threadID, messageID } = event;

      let groups = {};
      try { groups = await fs.readJson(groupsPath); } catch (e) { return; }

      const groupData = groups[threadID];
      if (!groupData || !groupData.settings?.autoReact) return;

      const react = event.body.toLowerCase();

      // 😆 - ضحك وسخرية
      if (
        react.includes("ضحك") || react.includes("حش الضحك") || react.includes("الضحك") ||
        react.includes("اضحكني") || react.includes("كيكة") || react.includes("منفسك") ||
        react.includes("حشك") || react.includes("حشو") || react.includes("حشوك") ||
        react.includes("لول") || react.includes("هاها") || react.includes("ههه") ||
        react.includes("هههه") || react.includes("هههههه") || react.includes("xd") ||
        react.includes("lol") || react.includes("lmao") || react.includes("😂") ||
        react.includes("😆") || react.includes("😩") || react.includes("😹") ||
        react.includes("🤣") || react.includes("واي") || react.includes("زعل") ||
        react.includes("shit") || react.includes("شيت") || react.includes("fuck") ||
        react.includes("بانكاي") || react.includes("خروف") || react.includes("وزع") ||
        react.includes("سواقة") || react.includes("مياو") || react.includes("كلكني") ||
        react.includes("صيص") || react.includes("نكم") || react.includes("نكمك") ||
        react.includes("اسود") || react.includes("زرقو") || react.includes("poor") ||
        react.includes("trash") || react.includes("nigga") || react.includes("script kiddie") ||
        react.includes("امك") || react.includes("اسرة") || react.includes("خالة") ||
        react.includes("شحدتك") || react.includes("زوجة") || react.includes("bts") ||
        react.includes("الرجفة") || react.includes("ركز") || react.includes("الشتاء") ||
        react.includes("🖕") || react.includes("🤢") || react.includes("😝") ||
        react.includes("🤐") || react.includes("bold") || react.includes("gagi") ||
        react.includes("hayop") || react.includes("kagagohan") || react.includes("kagaguhan") ||
        react.includes("kingina") || react.includes("abno") || react.includes("biot") ||
        react.includes("bayot") || react.includes("bakla") || react.includes("sapak") ||
        react.includes("bisaya") || react.includes("hindot") || react.includes("jesus") ||
        react.includes("jesos") || react.includes("nan") || react.includes("am")
      ) {
        return api.setMessageReaction("😆", messageID, () => {}, true);
      }

      // 🙂 - محبة وعلاقات
      if (
        react.includes("بوسة") || react.includes("احبك") || react.includes("احشك") ||
        react.includes("حبك") || react.includes("حشني") || react.includes("اقعد") ||
        react.includes("راسي") || react.includes("جوكس") || react.includes("kiss") ||
        react.includes("خمسين") || react.includes("50") || react.includes("الزبير") ||
        react.includes("😊") || react.includes("💋") || react.includes("🫶") ||
        react.includes("😗") || react.includes("😙") || react.includes("😘") ||
        react.includes("😚") || react.includes("ugh") || react.includes("sige pa") ||
        react.includes("اه") || react.includes("ااه") || react.includes("شفتو")
      ) {
        return api.setMessageReaction("🙂", messageID, () => {}, true);
      }

      // 😢 - حزن وتعب
      if (
        react.includes("مريض") || react.includes("عيان") || react.includes("مكسل") ||
        react.includes("طردوني") || react.includes("امتحان") || react.includes("مدرسة") ||
        react.includes("ما منشط") || react.includes("انتهي") || react.includes("مافي") ||
        react.includes("قطعت") || react.includes("اتوفي") || react.includes("اتوفت") ||
        react.includes("ماتت") || react.includes("حزن") || react.includes("زهجان") ||
        react.includes("زهجانة") || react.includes("sad") || react.includes("sakit") ||
        react.includes("😿") || react.includes("😥") || react.includes("😰") ||
        react.includes("😨") || react.includes("😢") || react.includes(":(") ||
        react.includes("😔") || react.includes("😞")
      ) {
        return api.setMessageReaction("😢", messageID, () => {}, true);
      }

      // 🖤 - هدوء وروحانيات
      if (
        react.includes("سينكو") || react.includes("الصلاة") || react.includes("صلو") ||
        react.includes("الدعاء") || react.includes("وسكي") || react.includes("ويسكي") ||
        react.includes("السعودية") || react.includes("كيومي") || react.includes("evening") ||
        react.includes("night") || react.includes("eat")
      ) {
        return api.setMessageReaction("🖤", messageID, () => {}, true);
      }

    } catch (err) {}
  }
};

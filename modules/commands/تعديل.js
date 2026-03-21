const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { gptEdit, fluxEdit } = require("../../func/api_funcs");

module.exports = {
  config: {
    name: 'تعديل',
    aliases: ['edit', 'تعديل', 'ها', 'fluxedit'],
    version: '1.0.0',
    author: 'ابلين',
    countDown: 30,
    role: 0,
    description: 'تعديل الصور بالذكاء الاصطناعي (GPT-Image أو Flux Kontext)',
    category: 'ai',
    guide: { ar: '{pn} [gpt|flux] [الوصف] (رد على صورة)' }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;

    const photoAttachment = messageReply?.attachments?.find(a => a.type === "photo");

    if (!photoAttachment || args.length < 2) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ تعديل الصور بالذكاء الاصطناعي ⟭\n` +
        `✾ ┇ ◍ الطريقة:\n` +
        `✾ ┇   رد على صورة + تعديل_صورة [نوع] [الوصف]\n` +
        `✾ ┇\n` +
        `✾ ┇ ◍ الأنواع:\n` +
        `✾ ┇   gpt → GPT-Image-1 (قوي)\n` +
        `✾ ┇   flux → Flux Kontext Max (سريع)\n` +
        `✾ ┇\n` +
        `✾ ┇ ◍ مثال:\n` +
        `✾ ┇   تعديل_صورة gpt make her hair blue\n` +
        `✾ ┇   تعديل_صورة flux add sunglasses\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    const type = args[0].toLowerCase();
    const prompt = args.slice(1).join(" ").trim();

    if (type !== "gpt" && type !== "flux") {
      return api.sendMessage(`❌ | النوع يجب أن يكون "gpt" أو "flux"`, threadID, messageID);
    }

    if (!prompt) {
      return api.sendMessage(`⚠️ | اكتب وصف التعديل المطلوب`, threadID, messageID);
    }

    const imgUrl = photoAttachment.url;
    const typeName = type === "gpt" ? "GPT-Image-1" : "Flux Kontext Max";

    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
      `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
      `✾ ┇ ⏣ ⟬ تعديل الصورة ⟭\n` +
      `✾ ┇ ◍ النوع: ${typeName}\n` +
      `✾ ┇ ◍ التعديل: ${prompt}\n` +
      `✾ ┇ ◍ جاري التعديل... ⏳\n` +
      `⏣────── ✾ ⌬ ✾ ──────⏣`,
      threadID, messageID
    );

    try {
      const result = type === "gpt" ? await gptEdit(prompt, imgUrl) : await fluxEdit(prompt, imgUrl);

      const imageUrl = result?.imageUrl || result?.image_url || result?.url ||
        result?.data?.imageUrl || result?.data?.image_url || result?.data?.url;

      if (!imageUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل التعديل، جرب مرة أخرى\n${JSON.stringify(result).slice(0, 100)}`, threadID, messageID);
      }

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const imgPath = path.join(cacheDir, `edit_${Date.now()}.jpg`);
      fs.writeFileSync(imgPath, imgResponse.data);

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تم التعديل!\n✾ ┇ ◍ ${typeName}\n✾ ┇ ◍ التعديل: ${prompt}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        try { fs.unlinkSync(imgPath); } catch (e) {}
      }, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ | خطأ: ${error.message}`, threadID, messageID);
    }
  }
};

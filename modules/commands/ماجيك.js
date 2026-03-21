const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { MagicAi } = require("../../func/api_funcs");

const DEFAULT_MODELS = [
  { id: 27, name: "Standard", default: { cfg: 7, steps: 20, sampler_name: "euler", scheduler_name: "normal" } },
  { id: 28, name: "Anime", default: { cfg: 7, steps: 25, sampler_name: "euler_ancestral", scheduler_name: "normal" } },
  { id: 29, name: "Realistic", default: { cfg: 7, steps: 30, sampler_name: "dpmpp_2m", scheduler_name: "karras" } },
];

const RATIOS = { '1': 0, '2': 1, '3': 2, '4': 3 };
const RATIO_NAMES = { '0': '1:1', '1': '9:16', '2': '16:9', '3': '3:4' };

module.exports = {
  config: {
    name: 'ماجيك',
    aliases: ['magic', 'magicai'],
    version: '1.0.0',
    author: 'ابلين',
    countDown: 30,
    role: 0,
    description: 'توليد صور بـ MagicAI بموديلات متعددة',
    category: 'ai',
    guide: { ar: '{pn} [0|1|2] [النسبة 1-4] [الوصف]\n0=عادي 1=أنمي 2=واقعي | 1=مربع 2=طولي 3=عرضي 4=3:4' }
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ MagicAI ⟭\n` +
        `✾ ┇ ◍ الموديلات:\n` +
        `✾ ┇   0 = عادي (Standard)\n` +
        `✾ ┇   1 = أنمي (Anime)\n` +
        `✾ ┇   2 = واقعي (Realistic)\n` +
        `✾ ┇ ◍ النسبة:\n` +
        `✾ ┇   1=1:1  2=9:16  3=16:9  4=3:4\n` +
        `✾ ┇ ◍ مثال: ماجيك 1 1 cute anime girl\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    const modelNum = parseInt(args[0]);
    const ratioKey = args[1];
    const prompt = args.slice(2).join(" ").trim();

    if (isNaN(modelNum) || modelNum < 0 || modelNum >= DEFAULT_MODELS.length) {
      return api.sendMessage(`❌ | الموديل يجب أن يكون 0 أو 1 أو 2`, threadID, messageID);
    }

    if (!RATIOS.hasOwnProperty(ratioKey)) {
      return api.sendMessage(`❌ | النسبة يجب أن تكون 1 أو 2 أو 3 أو 4`, threadID, messageID);
    }

    const selectedModel = DEFAULT_MODELS[modelNum];
    const ratioNum = RATIOS[ratioKey];
    const ratioName = RATIO_NAMES[ratioNum];

    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
      `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
      `✾ ┇ ⏣ ⟬ MagicAI ⟭\n` +
      `✾ ┇ ◍ الموديل: ${selectedModel.name}\n` +
      `✾ ┇ ◍ النسبة: ${ratioName}\n` +
      `✾ ┇ ◍ ${prompt ? `الوصف: ${prompt}` : 'وصف عشوائي 🎲'}\n` +
      `✾ ┇ ◍ جاري التوليد... ⏳\n` +
      `⏣────── ✾ ⌬ ✾ ──────⏣`,
      threadID, messageID
    );

    try {
      const magic = new MagicAi(null, DEFAULT_MODELS);
      const result = await magic.Generate(
        prompt || null,
        selectedModel.id,
        ratioNum,
        '',
        modelNum
      );

      if (!result) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | فشل التوليد`, threadID, messageID);
      }

      const imageUrl = result.image_path || result.url || result.image_url;
      if (!imageUrl) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ | لم يتم الحصول على الصورة`, threadID, messageID);
      }

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const imgPath = path.join(cacheDir, `magic_${Date.now()}.jpg`);
      fs.writeFileSync(imgPath, imgResponse.data);

      await api.sendMessage({
        body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تم التوليد!\n✾ ┇ ◍ الموديل: ${selectedModel.name}\n✾ ┇ ◍ النسبة: ${ratioName}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
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

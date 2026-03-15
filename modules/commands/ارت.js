const FormData = require('form-data');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "ارت",
    version: "1.0.0",
    author: "سينكو",
    countDown: 5,
    role: 0,
    description: "تحويل صورك إلى ستايلات أنمي مذهلة 🎨",
    category: "ai",
    guide: { ar: "{pn} [رقم] (رد على صورة)" }
  },

  onStart: async function({ api, event, args }) {
    const { senderID, messageReply, threadID, messageID } = event;
    const cmd = args[0]?.toLowerCase();

    // ═══════════════ عرض القائمة ═══════════════
    if (!cmd) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ أوامـر الـتـحـويـل ⟭\n` +
        `✾ ┇ ◍ ارت [رقم]: رد على صورة\n` +
        `✾ ┇ ◍ ارت موديلات: عرض الستايلات\n` +
        `✾ ┇ ◍ ارت بحث: البحث عن ستايل\n` +
        `✾ ┇ ◍ ارت احصائيات: حالة النظام\n` +
        `✾ ┇ ⸻⸻⸻⸻⸻\n` +
        `✾ ┇ ◍ مـثـال: ارت 29 (رد على صورة)\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    // ═══════════════ الإحصائيات ═══════════════
    if (cmd === "احصائيات" || cmd === "stats") {
      const models = await Models();
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ إحـصـائـيـات الـنـظـام ⟭\n` +
        `✾ ┇ ◍ الـسـتـايـلات: ${models.length}\n` +
        `✾ ┇ ◍ الـشـعـبـيـة: Anime Style\n` +
        `✾ ┇ ◍ الـحـالـة: مـتـصـل ✅\n` +
        `✾ ┇ ⸻⸻⸻⸻⸻\n` +
        `✾ ┇ ◍ اكـتب "ارت موديلات" للعرض\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    // ═══════════════ عرض الموديلات ═══════════════
    if (cmd === "موديلات" || cmd === "models" || cmd === "list") {
      const page = parseInt(args[1]) || 1;
      const models = await Models();
      return await showModels(models, page, api, threadID, senderID, `⏣ ⟬ قـائـمـة الـسـتـايـلات ⟭`);
    }

    // ═══════════════ البحث ═══════════════
    if (cmd === "بحث" || cmd === "search") {
      const searchQuery = args.slice(1).join(" ").trim();
      if (!searchQuery) return api.sendMessage("🔍 يرجى كتابة كلمة للبحث عنها!", threadID, messageID);

      const models = await Models(searchQuery);
      if (models.length === 0) return api.sendMessage(`😢 لم يتم العثور على "${searchQuery}"`, threadID, messageID);

      return await showModels(models, 1, api, threadID, senderID, `⏣ ⟬ نـتـائـج الـبـحـث ⟭`);
    }

    // ═══════════════ تحويل الصورة ═══════════════
    if (messageReply?.attachments?.[0]?.type === "photo") {
      let styleNum = 29; 
      if (args[0] && !isNaN(args[0])) styleNum = parseInt(args[0]);

      const models = await Models();
      if (styleNum < 0 || styleNum >= models.length) return api.sendMessage(`❌ رقم غير صالح! اختر بين 0 و ${models.length - 1}`, threadID, messageID);

      const selectedStyle = models[styleNum];
      api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ جـاري الـتـحـويـل ⟭\n` +
        `✾ ┇ ◍ الـسـتايل: ${selectedStyle.name}\n` +
        `✾ ┇ ◍ الـحـالـة: يـتم الـمـعالـجـة...\n` +
        `✾ ┇ ◍ الـوقـت: 5-10 ثـوانـي ⏱️\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`, 
        threadID, messageID
      );

      try {
        const imgResponse = await axios.get(messageReply.attachments[0].url, { responseType: "arraybuffer", timeout: 30000 });
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const imgPath = path.join(cacheDir, `Art${Date.now()}.png`);
        fs.writeFileSync(imgPath, imgResponse.data);

        const result = await ProcessImage(imgPath, selectedStyle.id);
        const resultStream = await axios.get(result, { responseType: 'stream' });
        
        await api.sendMessage({
          body: `⏣────── ✾ ⌬ ✾ ──────⏣\n✾ ┇ ✅ تـم الـتـحـويـل بـنـجـاح!\n✾ ┇ الـسـتـايـل: ${selectedStyle.name}\n⏣────── ✾ ⌬ ✾ ──────⏣`,
          attachment: resultStream.data
        }, threadID, (err) => {
           if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, messageID);

      } catch (error) {
        return api.sendMessage(`❌ فشل النظام: ${error.message}`, threadID, messageID);
      }
    } else {
      return api.sendMessage(`📸 يرجى الرد على صورة أولاً!`, threadID, messageID);
    }
  },

  onReply: async function({ api, event, handleReply }) {
    if (handleReply.name !== "ارت") return;
    const page = parseInt(event.body);
    if (isNaN(page)) return;
    return await showModels(handleReply.models, page, api, event.threadID, event.senderID, handleReply.title);
  }
};

async function showModels(models, page, api, threadID, author, title) {
  const pageSize = 20;
  const totalPages = Math.ceil(models.length / pageSize);
  if (page < 1 || page > totalPages) return api.sendMessage(`📄 الصفحة غير موجودة! اختر بين 1 و ${totalPages}`, threadID);

  const start = (page - 1) * pageSize;
  const modelsPage = models.slice(start, start + pageSize);

  let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n`;
  msg += `✾ ┇ ${title}\n`;
  msg += `✾ ┇ الـصـفـحـة: ${page} مـن ${totalPages}\n✾ ┇\n`;
  
  modelsPage.forEach(m => msg += `✾ ┇ ◍ ${m.originalIndex} - ${m.name}\n`);
  
  msg += `✾ ┇\n✾ ┇ ◍ رد بـرقم الـصـفـحـة لـلـتـنـقل\n`;
  msg += `⏣────── ✾ ⌬ ✾ ──────⏣`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      name: "ارت",
      messageID: info.messageID,
      author: author,
      models: models,
      title: title
    });
  });
}

async function Models(searchQuery = "") {
  const idgen = genUID();
  try {
    const res = await axios.get(`https://be.aimirror.fun/filter_search?uid=${idgen}`, {
      headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen }
    });
    
    let models = res.data.search_info
      .filter(i => !i.key_words.includes("video"))
      .map((i, index) => ({ id: i.model_id, name: i.model, key_words: i.key_words, originalIndex: index }));

    models = [...new Map(models.map(i => [i.id, i])).values()];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      models = models.filter(m => m.name.toLowerCase().includes(q) || m.key_words.some(k => k.toLowerCase().includes(q)));
    }
    return models.map((m, i) => ({ ...m, originalIndex: i }));
  } catch (e) { return []; }
}

async function ProcessImage(imagePath, modelId) {
  const idgen = genUID();
  const token = (await axios.get(`https://be.aimirror.fun/app_token/v2?cropped_image_hash=${crypto.randomBytes(20).toString('hex')}.jpeg&uid=${idgen}`, {
    headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen }
  })).data;

  const form = new FormData();
  Object.keys(token).forEach(key => form.append(key, token[key]));
  form.append('file', fs.createReadStream(imagePath));
  await axios.post('https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.com', form, { headers: form.getHeaders() });

  const { width, height } = imageSize(fs.readFileSync(imagePath));
  const task = (await axios.post(`https://be.aimirror.fun/draw?uid=${idgen}`, {
    model_id: parseInt(modelId), cropped_image_key: token.key, cropped_height: height, cropped_width: width,
    package_name: "com.ai.polyverse.mirror", version: "6.2.4", force_default_pose: true, is_free_trial: true, free_size: true
  }, { headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen } })).data;

  let result;
  while (true) {
    await new Promise(r => setTimeout(r, 2000));
    result = (await axios.get(`https://be.aimirror.fun/draw/process?draw_request_id=${task.draw_request_id}&uid=${idgen}`, {
      headers: { 'User-Agent': 'AIMirror/6.2.4+168 (android)', 'uid': idgen }
    })).data;
    if (result.draw_status === "SUCCEED") break;
    if (result.draw_status === "FAILED") throw new Error("فشل المعالجة");
  }
  return result.generated_image_addresses[0];
}

function genUID() {
  const prefix = 'fe20871';
  let random = '';
  for (let i = 0; i < 9; i++) random += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  return prefix + random;
}

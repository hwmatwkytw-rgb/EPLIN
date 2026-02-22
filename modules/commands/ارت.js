const FormData = require('form-data');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "ارت",
    version: "2.0",
    author: "Gry KJ / تعديل سينكو",
    countDown: 10,
    prefix: true,
    description: "تحويل صورك إلى ستايلات أنمي مذهلة باستخدام AI Mirror 🎨",
    category: "ai",
    guide: {
      ar: "{pn} [رقم الستايل] (رد على صورة)"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, messageReply, threadID, messageID } = event;
    const cmd = args[0]?.toLowerCase();

    // ═══════════════ عرض القائمة ═══════════════
    if (!cmd || (isNaN(cmd) && !["مفضل", "fav", "احصائيات", "stats", "موديلات", "models", "list", "بحث", "search"].includes(cmd))) {
      return api.sendMessage(
        `●───── ⌬ ─────●\n` +
        `🎨 أوامر Art - المحول الاحترافي\n` +
        `●───── ⌬ ─────●\n` +
        `🖼️ {pn} [رقم] - رد على صورة\n` +
        `📋 {pn} موديلات - عرض الستايلات\n` +
        `🔍 {pn} بحث <كلمة> - البحث\n` +
        `⭐ {pn} مفضل <رقم> - حفظ ستايلك\n` +
        `📊 {pn} احصائيات - الموديلات المتاحة\n` +
        `●───── ⌬ ─────●`, threadID, messageID
      );
    }

    // ═══════════════ حفظ المفضل ═══════════════
    if (cmd === "مفضل" || cmd === "fav") {
      const fav = parseInt(args[1]);
      if (isNaN(fav)) return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ يرجى كتابة رقم الستايل\n●───── ⌬ ─────●", threadID, messageID);

      const models = await Models();
      if (fav < 0 || fav >= models.length) return api.sendMessage(`❌ رقم خاطئ! المدى من 0 لـ ${models.length - 1}`, threadID, messageID);

      await usersData.set(senderID, { styleNum: fav }, "data");
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(`●───── ⌬ ─────●\n✅ تم حفظ الستايل المفضل!\n🎭 ${models[fav].name}\n●───── ⌬ ─────●`, threadID, messageID);
    }

    // ═══════════════ الإحصائيات ═══════════════
    if (cmd === "احصائيات" || cmd === "stats") {
      api.setMessageReaction("📊", messageID, () => {}, true);
      const models = await Models();
      const userData = await usersData.get(senderID);
      return api.sendMessage(
        `●───── ⌬ ─────●\n` +
        `📊 إحصائيات Art\n` +
        `🎨 الستايلات: ${models.length}\n` +
        `⭐ مفضلك: ${userData.data?.styleNum ?? "غير محدد"}\n` +
        `●───── ⌬ ─────●`, threadID, messageID
      );
    }

    // ═══════════════ عرض الموديلات والبحث ═══════════════
    if (["موديلات", "models", "list", "بحث", "search"].includes(cmd)) {
      api.setMessageReaction("🔎", messageID, () => {}, true);
      let query = (cmd === "بحث" || cmd === "search") ? args.slice(1).join(" ") : "";
      const models = await Models(query);
      
      if (models.length === 0) return api.sendMessage("●───── ⌬ ─────●\n┇ 😢 لم يتم العثور على نتائج\n●───── ⌬ ─────●", threadID, messageID);
      
      return await showModels(api, models, 1, threadID, messageID, senderID, query ? `🔎 نتائج البحث: ${query}` : `🎨 قائمة الستايلات`);
    }

    // ═══════════════ تحويل الصورة ═══════════════
    if (messageReply?.attachments?.[0]?.type === "photo") {
      api.setMessageReaction("⌚", messageID, () => {}, true);
      
      const userData = await usersData.get(senderID);
      let styleNum = (!isNaN(args[0])) ? parseInt(args[0]) : (userData.data?.styleNum ?? 29);

      const models = await Models();
      if (styleNum < 0 || styleNum >= models.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ رقم الستايل غير موجود.`, threadID, messageID);
      }

      const selectedStyle = models[styleNum];
      const statusMsg = await new Promise(r => api.sendMessage(`●───── ⌬ ─────●\n┇ 🎨 جاري التحويل...\n┇ 🎭 الستايل: ${selectedStyle.name}\n●───── ⌬ ─────●`, threadID, (err, info) => r(info), messageID));

      try {
        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);
        const imgPath = path.join(cacheDir, `art_${Date.now()}.png`);

        const imgRes = await axios.get(messageReply.attachments[0].url, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, Buffer.from(imgRes.data));

        const resultUrl = await ProcessImage(imgPath, selectedStyle.id);
        const resultPath = path.join(cacheDir, `result_${Date.now()}.png`);
        const resBuffer = await axios.get(resultUrl, { responseType: "arraybuffer" });
        await fs.writeFile(resultPath, Buffer.from(resBuffer.data));

        await api.sendMessage({
          body: `●───── ⌬ ─────●\n┇ ✅ تم التحويل بنجاح!\n┇ 🎭 الستايل: ${selectedStyle.name}\n●───── ⌬ ─────●`,
          attachment: fs.createReadStream(resultPath)
        }, threadID, () => {
          api.setMessageReaction("✅", messageID, () => {}, true);
          api.unsendMessage(statusMsg.messageID);
          fs.unlinkSync(imgPath);
          fs.unlinkSync(resultPath);
        }, messageID);

      } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage("●───── ⌬ ─────●\n┇ ❌ حدث خطأ أثناء المعالجة\n●───── ⌬ ─────●", threadID, messageID);
      }
    } else {
      return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ رد على صورة برقم الستايل\n●───── ⌬ ─────●", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    if (event.senderID !== Reply.author) return;
    const page = parseInt(event.body);
    if (isNaN(page)) return;

    return await showModels(api, Reply.pages, page, event.threadID, event.messageID, event.senderID, Reply.title);
  }
};

// --- الدوال المساعدة (نفس المنطق السابق مع تعديل التنسيق) ---

async function showModels(api, models, page, threadID, messageID, author, title) {
  const pageSize = 20;
  const totalPages = Math.ceil(models.length / pageSize);
  if (page < 1 || page > totalPages) return;

  const start = (page - 1) * pageSize;
  const modelsPage = models.slice(start, start + pageSize);

  let msg = `●───── ⌬ ─────●\n┇ ${title}\n┇ 📄 صفحة ${page}/${totalPages}\n●───── ⌬ ─────●\n`;
  modelsPage.forEach(m => msg += `┇ ${m.originalIndex} - ${m.name}\n`);
  msg += `●───── ⌬ ─────●\n💬 رد برقم الصفحة للتنقل`;

  api.sendMessage(msg, threadID, (err, info) => {
    global.GoatBot.onReply.set(info.messageID, {
      commandName: "ارت",
      messageID: info.messageID,
      author,
      pages: models,
      title
    });
  }, messageID);
}

async function Models(searchQuery = "") {
  const idgen = genUID();
  const res = await axios.get(`https://be.aimirror.fun/filter_search?uid=${idgen}`);
  let models = res.data.search_info
    .filter(i => !i.key_words.includes("video"))
    .map((i, index) => ({ id: i.model_id, name: i.model, key_words: i.key_words, originalIndex: index }));

  models = [...new Map(models.map(i => [i.id, i])).values()];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    models = models.filter(m => m.name.toLowerCase().includes(q) || m.key_words.some(k => k.toLowerCase().includes(q)));
  }
  return models.map((m, i) => ({ ...m, originalIndex: i }));
}

async function ProcessImage(imagePath, modelId) {
  const uid = genUID();
  const token = (await axios.get(`https://be.aimirror.fun/app_token/v2?cropped_image_hash=${crypto.randomBytes(10).toString('hex')}.jpeg&uid=${uid}`)).data;
  
  const form = new FormData();
  Object.keys(token).forEach(key => form.append(key, token[key]));
  form.append('file', fs.createReadStream(imagePath));
  await axios.post('https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.app-southeast-1.aliyuncs.com', form);

  const { width, height } = imageSize(fs.readFileSync(imagePath));
  const drawReq = await axios.post(`https://be.aimirror.fun/draw?uid=${uid}`, {
    model_id: parseInt(modelId),
    cropped_image_key: token.key,
    cropped_height: height,
    cropped_width: width,
    version: "6.2.4",
    is_free_trial: true
  });

  let result;
  while (true) {
    await new Promise(r => setTimeout(r, 2500));
    const check = await axios.get(`https://be.aimirror.fun/draw/process?draw_request_id=${drawReq.data.draw_request_id}&uid=${uid}`);
    if (check.data.draw_status === "SUCCEED") {
      result = check.data.generated_image_addresses[0];
      break;
    }
    if (check.data.draw_status === "FAILED") throw new Error("Processing failed");
  }
  return result;
}

function genUID() { return 'fe20871' + crypto.randomBytes(4).toString('hex'); }

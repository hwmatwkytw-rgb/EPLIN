const FormData = require('form-data');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "ارت",
    version: "2.5",
    author: "Gry KJ / تعديل سينكو",
    countDown: 15,
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

    // 1. عرض القائمة الرئيسية
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

    // 2. معالجة الأوامر الفرعية (مفضل، احصائيات، بحث)
    if (cmd === "مفضل" || cmd === "fav") {
      const fav = parseInt(args[1]);
      if (isNaN(fav)) return api.sendMessage("⚠️ يرجى كتابة رقم الستايل الصحيح.", threadID, messageID);
      const models = await Models();
      if (fav < 0 || fav >= models.length) return api.sendMessage(`❌ رقم خاطئ! المدى المتاح من 0 لـ ${models.length - 1}`, threadID, messageID);
      await usersData.set(senderID, { styleNum: fav }, "data");
      return api.sendMessage(`✅ تم حفظ الستايل [${models[fav].name}] كافتراضي لك.`, threadID, messageID);
    }

    if (cmd === "احصائيات" || cmd === "stats") {
      const models = await Models();
      const userData = await usersData.get(senderID);
      return api.sendMessage(`📊 الستايلات المتاحة: ${models.length}\n⭐ ستايلك المفضل: ${userData.data?.styleNum ?? "لم يحدد بعد"}`, threadID, messageID);
    }

    if (["موديلات", "models", "list", "بحث", "search"].includes(cmd)) {
      let query = (cmd === "بحث" || cmd === "search") ? args.slice(1).join(" ") : "";
      const models = await Models(query);
      if (models.length === 0) return api.sendMessage("❌ لم يتم العثور على نتائج للبحث.", threadID, messageID);
      return await showModels(api, models, 1, threadID, messageID, senderID, query ? `🔎 نتائج البحث: ${query}` : `🎨 قائمة الستايلات`);
    }

    // 3. معالجة تحويل الصورة
    if (messageReply?.attachments?.[0]?.type === "photo") {
      api.setMessageReaction("⌚", messageID, () => {}, true);
      
      const userData = await usersData.get(senderID);
      let styleNum = (!isNaN(args[0])) ? parseInt(args[0]) : (userData.data?.styleNum ?? 29);

      const models = await Models();
      if (styleNum < 0 || styleNum >= models.length) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ رقم الستايل غير موجود في القائمة.`, threadID, messageID);
      }

      const selectedStyle = models[styleNum];
      const statusMsg = await new Promise(r => api.sendMessage(`🎨 جاري التحويل بستايل: ${selectedStyle.name}...\n(قد يستغرق الأمر 10-20 ثانية)`, threadID, (err, info) => r(info), messageID));

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const imgPath = path.join(cacheDir, `art_${senderID}_${Date.now()}.png`);

      try {
        const imgRes = await axios.get(messageReply.attachments[0].url, { responseType: "arraybuffer" });
        await fs.writeFile(imgPath, Buffer.from(imgRes.data));

        const resultUrl = await ProcessImage(imgPath, selectedStyle.id);
        const resultPath = path.join(cacheDir, `res_${senderID}_${Date.now()}.png`);
        const resBuffer = await axios.get(resultUrl, { responseType: "arraybuffer" });
        await fs.writeFile(resultPath, Buffer.from(resBuffer.data));

        await api.sendMessage({
          body: `✅ تم التحويل بنجاح!\n🎭 الستايل: ${selectedStyle.name}`,
          attachment: fs.createReadStream(resultPath)
        }, threadID, () => {
          api.setMessageReaction("✅", messageID, () => {}, true);
          api.unsendMessage(statusMsg.messageID);
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
          if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
        }, messageID);

      } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", messageID, () => {}, true);
        api.sendMessage(`❌ فشل التحويل: ${e.message || "خطأ في السيرفر"}`, threadID, messageID);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    } else {
      return api.sendMessage("⚠️ يجب الرد على صورة لتنفيذ هذا الأمر.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;
    const page = parseInt(event.body);
    if (isNaN(page)) return;
    return await showModels(api, Reply.pages, page, event.threadID, event.messageID, event.senderID, Reply.title);
  }
};

// --- الدوال المساعدة المطورة ---

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
  try {
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
  } catch (err) {
    return [];
  }
}

async function ProcessImage(imagePath, modelId) {
  const uid = genUID();
  
  // طلب التوكن
  const tokenRes = await axios.get(`https://be.aimirror.fun/app_token/v2?uid=${uid}`);
  const token = tokenRes.data;
  
  const form = new FormData();
  Object.keys(token).forEach(key => {
    if (key !== 'url') form.append(key, token[key]);
  });
  form.append('file', fs.createReadStream(imagePath));

  // الرفع للسيرفر السحابي
  await axios.post('https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.app-southeast-1.aliyuncs.com', form, {
    headers: { ...form.getHeaders() }
  });

  const { width, height } = imageSize(fs.readFileSync(imagePath));
  
  // طلب المعالجة
  const drawReq = await axios.post(`https://be.aimirror.fun/draw?uid=${uid}`, {
    model_id: parseInt(modelId),
    cropped_image_key: token.key,
    cropped_height: height,
    cropped_width: width,
    version: "6.2.4",
    is_free_trial: true
  });

  if (!drawReq.data?.draw_request_id) throw new Error("السيرفر مشغول حالياً.");

  // مراقبة الحالة (Polling)
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 3000));
    const check = await axios.get(`https://be.aimirror.fun/draw/process?draw_request_id=${drawReq.data.draw_request_id}&uid=${uid}`);
    
    if (check.data.draw_status === "SUCCEED") {
      return check.data.generated_image_addresses[0];
    }
    if (check.data.draw_status === "FAILED") {
      throw new Error("فشل السيرفر في معالجة هذه الصورة.");
    }
    attempts++;
  }
  throw new Error("انتهى وقت الانتظار، السيرفر بطيء.");
}

function genUID() { 
  // تغيير البادئة لضمان عدم التعرف على الـ UID كبوت
  return 'fb' + crypto.randomBytes(6).toString('hex'); 
}

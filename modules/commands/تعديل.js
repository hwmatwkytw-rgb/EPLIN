const FormData = require('form-data');
const crypto = require('crypto');
const { imageSize } = require('image-size');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "تعديل",
    version: "1.2.0",
    author: "Gry KJ",
    countDown: 8,
    role: 0,
    description: "تعديل الصور بالوصف العربي 🎨",
    category: "ai",
    guide: { ar: "{pn} [الوصف بالعربي] (رد على صورة)" }
  },

  onStart: async function({ api, event, args }) {
    const { messageReply, threadID, messageID } = event;
    const arabicPrompt = args.join(" ");

    if (!messageReply || messageReply.attachments?.[0]?.type !== "photo") {
      return api.sendMessage(
        `●─────── ⌬ ───────●\n` +
        `┇ ⦿ ⟬ تـعـديـل بـالـوصـف ⟭\n` +
        `┇\n` +
        `┇ 📝 يرجى الرد على صورة وكتابة الوصف\n` +
        `┇ مـثـال: تعديل حولها لنمط سايبر بانك\n` +
        `●─────── ⌬ ───────●`,
        threadID, messageID
      );
    }

    if (!arabicPrompt) return api.sendMessage("⚠️ يرجى كتابة وصف للتعديل بالعربي!", threadID, messageID);

    try {
      // ترجمة الوصف من العربي للإنجليزي
      const translation = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(arabicPrompt)}`);
      const englishPrompt = translation.data[0][0][0];

      api.sendMessage(
        `●─────── ⌬ ───────●\n` +
        `┇ ⦿ ⟬ جـاري الـمـعـالـجـة ⟭\n` +
        `┇\n` +
        `┇ الـوصـف: ${arabicPrompt}\n` +
        `┇ الـتـرجمـة: ${englishPrompt}\n` +
        `┇ الـحـالـة: جـاري الـتـخـيـل... ⏳\n` +
        `●─────── ⌬ ───────●`, 
        threadID, messageID
      );

      const imgResponse = await axios.get(messageReply.attachments[0].url, { responseType: "arraybuffer" });
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imgPath = path.join(cacheDir, `Edit${Date.now()}.png`);
      fs.writeFileSync(imgPath, imgResponse.data);

      const result = await ProcessImageWithPrompt(imgPath, englishPrompt);
      const resultStream = await axios.get(result, { responseType: 'stream' });
      
      await api.sendMessage({
        body: `●─────── ⌬ ───────●\n┇ ✅ تـم الـتـعـديـل بـنـجـاح!\n┇ الـوصـف: ${arabicPrompt}\n●─────── ⌬ ───────●`,
        attachment: resultStream.data
      }, threadID, () => {
         if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, messageID);

    } catch (error) {
      return api.sendMessage(`❌ فشل في معالجة الطلب: ${error.message}`, threadID, messageID);
    }
  }
};

async function ProcessImageWithPrompt(imagePath, prompt) {
  const idgen = genUID();
  const token = (await axios.get(`https://be.aimirror.fun/app_token/v2?cropped_image_hash=${crypto.randomBytes(20).toString('hex')}.jpeg&uid=${idgen}`, {
    headers: { 'User-Agent': 'AIMirror/6.2.4', 'uid': idgen }
  })).data;

  const form = new FormData();
  Object.keys(token).forEach(key => form.append(key, token[key]));
  form.append('file', fs.createReadStream(imagePath));
  await axios.post('https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.com', form, { headers: form.getHeaders() });

  const { width, height } = imageSize(fs.readFileSync(imagePath));

  const task = (await axios.post(`https://be.aimirror.fun/draw?uid=${idgen}`, {
    model_id: 1001,
    prompt: prompt,
    cropped_image_key: token.key,
    cropped_height: height,
    cropped_width: width,
    package_name: "com.ai.polyverse.mirror",
    version: "6.2.4",
    is_free_trial: true,
    force_default_pose: true
  }, { headers: { 'User-Agent': 'AIMirror/6.2.4', 'uid': idgen } })).data;

  let result;
  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    result = (await axios.get(`https://be.aimirror.fun/draw/process?draw_request_id=${task.draw_request_id}&uid=${idgen}`, {
      headers: { 'User-Agent': 'AIMirror/6.2.4', 'uid': idgen }
    })).data;
    if (result.draw_status === "SUCCEED") break;
    if (result.draw_status === "FAILED") throw new Error("لم يستطع الذكاء الاصطناعي معالجة هذا الوصف.");
  }
  return result.generated_image_addresses[0];
}

function genUID() {
  const prefix = 'fe20871';
  let random = '';
  for (let i = 0; i < 9; i++) random += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  return prefix + random;
}

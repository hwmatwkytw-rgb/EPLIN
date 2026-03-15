const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'تعديل',
    version: '1.0',
    author: 'سينكو',
    countDown: 10,
    prefix: true,
    category: 'ai',
    description: 'إضافة فلاتر وتأثيرات احترافية على الصور (رد على صورة)',
    guide: { ar: '{pn} (رد على صورة)' }
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;
    
    // 1. التحقق من أن المستخدم رد على صورة
    if (!messageReply || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("✾ ┇ يرجى الرد على صورة أولاً لتعديلها 📸", threadID, messageID);
    }

    const imgUrl = messageReply.attachments[0].url;

    // 2. تجهيز قائمة الفلاتر المتاحة في الـ API
    const filters = [
      { id: "1", name: "أبيض وأسود", type: "grayscale" },
      { id: "2", name: "السلبي (إنعكاس الألوان)", type: "invert" },
      { id: "3", name: "الضبابي (Blur)", type: "blur" },
      { id: "4", name: "عـتـيـق (Sepia)", type: "sepia" },
      { id: "5", name: "نحت (Emboss)", type: "emboss" },
      { id: "6", name: "رسم فني (Edge)", type: "edge" },
      { id: "7", name: "قلم رصاص (Sketch)", type: "sketch" },
      { id: "8", name: "إضاءة ساطعة (Brighter)", type: "bright" },
      { id: "9", name: "إضاءة خافتة (Darker)", type: "dark" },
      { id: "10", name: "الكرتون (Cartoon)", type: "cartoon" }
    ];

    // 3. بناء الرسالة المزخرفة
    let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n`;
    msg += `✾ ┇\n`;
    msg += `✾ ┇ ⏣ ⟬ قـائـمـة الـفـلاتـر ⟭\n`;
    msg += `✾ ┇\n`;
    
    filters.forEach(f => msg += `✾ ┇ ◍ ${f.id} - ${f.name}\n`);
    
    msg += `✾ ┇\n`;
    msg += `✾ ┇ ◍ رد بـرقم الـفلتر لـلـتـطبيق 🛠️\n`;
    msg += `⏣────── ✾ ⌬ ✾ ──────⏣`;

    // 4. إرسال الرسالة وتسجيل نظام الرد (Reply)
    api.sendMessage(msg, threadID, (err, info) => {
      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: "تعديل",
        messageID: info.messageID,
        author: event.senderID,
        imgUrl: imgUrl,
        filters: filters
      });
    }, messageID);
  },

  // =========================================
  // نظام التعامل مع اختيار الرقم (Reply)
  // =========================================
  onReply: async ({ api, event, handleReply }) => {
    const { threadID, messageID, body, senderID } = event;
    
    // التحقق من أن الذي رد هو نفسه صاحب الطلب
    if (handleReply.author != senderID) return;

    try {
      // 1. التحقق من الرقم المختار
      const choice = parseInt(body);
      if (isNaN(choice) || choice > handleReply.filters.length || choice <= 0) {
        return api.sendMessage("✾ ┇ ركز.. اختر رقم من القائمة فقط (1 لـ 10) 🙄", threadID, messageID);
      }

      const selectedFilter = handleReply.filters[choice - 1];

      // 2. إخفاء رسالة القائمة وبدء المعالجة
      api.unsendMessage(handleReply.messageID);
      api.sendMessage("✾ ┇ جاري تطبيق الـفلتر... انتظر ثواني ⏳🥱", threadID, messageID);

      // 3. بناء رابط الـ API الرئيسي وتجهيز المسار
      const imgUrl = encodeURIComponent(handleReply.imgUrl);
      const apiUrl = `https://api.vtheng.com/edit/v1/${selectedFilter.type}.php?url=${imgUrl}`;
      const cachePath = path.join(__dirname, 'cache');
      
      // تأكد من وجود مجلد cache
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
      const filePath = path.join(cachePath, `edit_${selectedFilter.type}_${senderID}.png`);
      
      // 4. تحميل الصورة المعدلة من الـ API
      const response = await axios({
        method: 'get',
        url: apiUrl,
        responseType: 'arraybuffer'
      });

      fs.writeFileSync(filePath, Buffer.from(response.data));

      // 5. إرسال الصورة النهائية بالزخرفة
      const finalMsg = 
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇ ✅ تـم الـتـعـديـل بـنـجـاح!
✾ ┇ ◍ الـفلتر: ${selectedFilter.name}
✾ ┇ ◍ الـحـالة: جـاهـز لـلـنـشـر
⏣────── ✾ ⌬ ✾ ──────⏣`;

      await api.sendMessage({
        body: finalMsg,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if(fs.existsSync(filePath)) fs.unlinkSync(filePath); // حذف الملف بعد الإرسال
      }, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("⏣ ❌ فشل النظام في معالجة هذه الصورة، جرب صورة أخرى", threadID, messageID);
    }
  }
};

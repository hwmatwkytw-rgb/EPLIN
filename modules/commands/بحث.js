const fetch = require("node-fetch");

module.exports = {
  config: {
    name: 'بحث',
    version: '1.0',
    author: 'Kenji Cloud Custom',
    countDown: 4,
    prefix: true,
    adminOnly: false, // متاح للجميع للبحث عن المكتبات
    aliases: ['npm', 'مكتبة', 'نود'],
    description: 'البحث عن معلومات أي مكتبة في سجلات NPM',
    category: 'owner',
    guide: {
      ar: '{pn} [اسم المكتبة]'
    },
  },

  onStart: async ({ args, event, api }) => {
    const { threadID, messageID } = event;

    try {
      const pkgName = args[0];

      if (!pkgName) {
        return api.sendMessage("┌─── ⋆〖 ALERT 〗⋆ ───┐\n\n  ⚠️ يرجى إدخال اسم المكتبة المراد البحث عنها\n  مثال: !برمجة discord.js\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘", threadID, messageID);
      }

      // جلب البيانات من NPM Registry
      const response = await fetch(`https://registry.npmjs.com/${pkgName}`);
      
      if (response.status === 404) {
        return api.sendMessage("┌─── ⋆〖 ERROR 〗⋆ ───┐\n\n  ❌ لم يتم العثور على مكتبة بهذا الاسم\n\n└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘", threadID, messageID);
      }

      const body = await response.json();
      
      // استخراج المعلومات الأساسية
      const latestVersion = body["dist-tags"].latest;
      const versionInfo = body.versions[latestVersion];
      const description = body.description || "لا يوجد وصف لهذه المكتبة.";
      const license = body.license || "غير محدد";
      const author = body.author ? body.author.name : "غير معروف";
      const lastModified = new Date(body.time.modified).toLocaleDateString('ar-EG');

      // معالجة الاعتمادات (Dependencies)
      let deps = versionInfo.dependencies ? Object.keys(versionInfo.dependencies) : [];
      let depsText = "لا يوجد";
      
      if (deps.length > 0) {
        const displayDeps = deps.slice(0, 5); // عرض أول 5 فقط لتجنب طول الرسالة
        depsText = displayDeps.join(", ");
        if (deps.length > 5) depsText += ` ...وغيرها (${deps.length - 5})`;
      }

      // بناء الرسالة بستايل كنجي
      let msg = `┌─── ⋆〖 𝑛𝑝𝑚 𝑎𝑝𝑙𝑖𝑛 〗⋆ ───┐\n\n`;
      msg += `📦 ➔ الاسم: ${pkgName}\n`;
      msg += `📝 ➔ الوصف: ${description}\n\n`;
      
      msg += `🔹 ➔ الإصدار: ${latestVersion}\n`;
      msg += `⚖️ ➔ الرخصة: ${license}\n`;
      msg += `👤 ➔ المطور: ${author}\n`;
      msg += `📅 ➔ آخر تحديث: ${lastModified}\n\n`;
      
      msg += `🔗 ➔ التبعيات (Deps):\n`;
      msg += `╰╼ ${depsText}\n\n`;
      
      msg += `🌐 ➔ الرابط:\n`;
      msg += `╰╼ https://npmjs.com/package/${pkgName}\n\n`;
      msg += `└─── ⋆ ⚡ CLOUD ⚡ ⋆ ───┘`;

      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`❌ حدث خطأ أثناء جلب البيانات: ${error.message}`, threadID, messageID);
    }
  },
};

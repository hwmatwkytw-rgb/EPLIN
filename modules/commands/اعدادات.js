const config = {
    name: "اعدادات",
    aliases: ["الضبط", "settings", "setting"],
    description: "لوحة التحكم بحماية وخصائص المجموعة",
    cooldown: 5,
    permissions: [1], // للمشرفين فقط
    credits: "Gemini ✨",
};

const langData = {
    ar_SY: {
        menu: 
`╔══════════════════╗
       ⚙️ لوحة التحكم ⚙️
╚══════════════════╝
① 🛡️ مكافحة السبام: [{antiSpam}]
② 🚫 منع الخروج: [{antiOut}]
③ 🏷️ قفل الاسم: [{antiChangeGroupName}]
④ 🖼️ قفل الصورة: [{antiChangeGroupImage}]
⑤ 🎭 قفل الكنيات: [{antiChangeNickname}]
⑥ 🔔 التنبيهات: [{notifyChange}]
╚══════════════════╝
↫ أرسل (رقم الخيار) لتغييره
↫ يمكنك اختيار أكثر من رقم (مثلاً: 1 2 5)`,

        notGroup: "❌ عذراً، هذا الأمر مخصص للمجموعات فقط.",
        invalid: "⚠️ يرجى اختيار رقم صحيح من القائمة (1-6).",
        success: "✅ تم تحديث إعدادات المجموعة وحفظها بنجاح!",
        botNotAdmin: "⚠️ تنبيه: البوت ليس مشرفاً! تم تعطيل (منع الخروج والسبام) تلقائياً.",

        confirm: 
`╔══════════════════╗
      📝 مراجعة التغييرات
╚══════════════════╝
① [{antiSpam}] | ② [{antiOut}]
③ [{antiChangeGroupName}] | ④ [{antiChangeGroupImage}]
⑤ [{antiChangeNickname}] | ⑥ [{notifyChange}]
╚══════════════════╝
↫ تفاعل بـ 👍 لتأكيد الحفظ`,
    },
};

// دالة تأكيد التغيير عبر التفاعل (Reaction)
async function confirmChange({ message, getLang, eventData }) {
    if (message.reaction !== "👍") return;

    try {
        await global.controllers.Threads.updateData(message.threadID, {
            antiSettings: eventData.newSettings,
        });
        message.send(getLang("success"));
    } catch (err) {
        message.send("❌ حدث خطأ أثناء محاولة حفظ البيانات.");
    }
}

// دالة اختيار الخيارات من القائمة عبر الرد (Reply)
async function chooseMenu({ message, getLang, data }) {
    const input = message.args.map(Number).filter(n => n >= 1 && n <= 6);
    if (input.length === 0) return message.reply(getLang("invalid"));

    const currentSettings = data.thread.data?.antiSettings || {};
    const keys = [
        "antiSpam",
        "antiOut",
        "antiChangeGroupName",
        "antiChangeGroupImage",
        "antiChangeNickname",
        "notifyChange",
    ];

    // إنشاء كائن الإعدادات الجديد بناءً على القديم
    const newSettings = {};
    keys.forEach(k => newSettings[k] = !!currentSettings[k]);

    // تبديل القيم المختارة (Toggle)
    input.forEach(n => {
        const key = keys[n - 1];
        newSettings[key] = !newSettings[key];
    });

    // التحقق من صلاحيات البوت
    const isBotAdmin = data.thread.info.adminIDs.includes(global.botID);
    if (!isBotAdmin) {
        newSettings.antiOut = false;
        newSettings.antiSpam = false;
        await message.reply(getLang("botNotAdmin"));
    }

    // تجهيز العرض البصري (✅/❌)
    const view = {};
    keys.forEach(k => view[k] = newSettings[k] ? "✅" : "❌");

    const msg = await message.reply(getLang("confirm", view));
    
    // إضافة حدث التفاعل للحفظ
    msg.addReactEvent({ 
        callback: confirmChange, 
        newSettings 
    });
}

// الدالة الأساسية عند استدعاء الأمر
async function onCall({ message, getLang, data }) {
    if (!data.thread?.info?.isGroup) {
        return message.reply(getLang("notGroup"));
    }

    const settings = data.thread.data?.antiSettings || {};
    const view = {};
    
    [
        "antiSpam", "antiOut", "antiChangeGroupName", 
        "antiChangeGroupImage", "antiChangeNickname", "notifyChange"
    ].forEach(k => view[k] = settings[k] ? "✅" : "❌");

    const msg = await message.reply(getLang("menu", view));

    // إضافة حدث الرد لاختيار الأرقام
    msg.addReplyEvent({ 
        callback: chooseMenu 
    });
}

export default {
    config,
    langData,
    onCall,
};

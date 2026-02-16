const fs = require("fs-extra");
const path = require("path");

// مسار تخزين القائمة السوداء
const blacklistPath = path.join(__dirname, "cache", "blacklist.json");

// ضع هنا ID حساب المطور فقط
const DEV_ID = "61586897962846"; // حسابك فقط

// إنشاء ملف blacklist إذا غير موجود
function getBlacklist() {
    if (!fs.existsSync(blacklistPath)) fs.writeJsonSync(blacklistPath, []);
    return fs.readJsonSync(blacklistPath);
}

module.exports = {
    config: {
        name: "الطلبات",
        version: "5.3",
        author: "Hridoy",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إدارة طلبات الانضمام والقائمة السوداء (للمطور فقط)",
        category: "المطور",
        guide: { ar: "{pn} [u/t/a/احصائيات/فحص]" }
    },

    onReply: async ({ api, event, handleReply }) => {
        const { body, threadID, messageID, senderID } = event;

        if (senderID !== DEV_ID) {
            return api.sendMessage("❌ هذا الأمر خاص بالمطور فقط.", threadID, messageID);
        }

        try {
            const bl = getBlacklist();

            if (/^(رفض|حظر)/i.test(body)) {
                const isBan = /^حظر/i.test(body);
                const indexes = body.replace(/رفض|حظر/gi, "").trim().split(/\s+/);

                for (const i of indexes) {
                    const target = handleReply.pending[i - 1];
                    if (!target) continue;

                    await api.sendMessage(
                        `⚠️ تم رفض طلبكم ${isBan ? "وحظر المجموعة" : ""} ✨.`,
                        target.threadID
                    );

                    if (isBan) {
                        if (!bl.includes(target.threadID)) bl.push(target.threadID);
                        fs.writeJsonSync(blacklistPath, bl);
                    }

                    await api.removeUserFromGroup(api.getCurrentUserID(), target.threadID);
                }

                return api.sendMessage(
                    `✅ تم تنفيذ ${isBan ? "الحظر 🚫" : "الرفض ❌"} على (${indexes.length}) طلب بنجاح! 🌟`,
                    threadID,
                    messageID
                );

            } else {
                const indexes = body.trim().split(/\s+/);

                for (const i of indexes) {
                    const target = handleReply.pending[i - 1];
                    if (!target) continue;

                    await api.unsendMessage(handleReply.messageID);
                    await api.changeNickname(`[ BOT ]`, target.threadID, api.getCurrentUserID());

                    await api.sendMessage(
                        `✅ تم تفعيل البوت بنجاح!\n💡 حالة البوت: نشط الآن\n📝 اكتب (الاوامر) للبدء.`,
                        target.threadID
                    );
                }

                return api.sendMessage(
                    `✅ تم تفعيل البوت في المجموعات المحددة ✨`,
                    threadID,
                    messageID
                );
            }

        } catch (error) {
            console.error("خطأ في onReply:", error);
            return api.sendMessage("❌ حدث خطأ أثناء تنفيذ العملية.", threadID, messageID);
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;

        if (senderID !== DEV_ID) {
            return api.sendMessage("❌ هذا الأمر خاص بالمطور فقط.", threadID, messageID);
        }

        try {
            const blacklist = getBlacklist();

            if (args[0] === "احصائيات") {
                const active = await api.getThreadList(100, null, ["INBOX"]);
                const pending = await api.getThreadList(100, null, ["PENDING", "OTHER"]);

                return api.sendMessage(
                    `📊 ━━━ إحصائيات البوت ━━━\n🟢 مفعلة: ${active.length}\n⏳ قيد الانتظار: ${pending.length}\n🚫 المحظورة: ${blacklist.length}\n━━━━━━━━━━━━━`,
                    threadID
                );
            }

            let list = [
                ...(await api.getThreadList(100, null, ["OTHER"])),
                ...(await api.getThreadList(100, null, ["PENDING"]))
            ];

            if (args[0] === "u") list = list.filter(i => !i.isGroup);
            if (args[0] === "t") list = list.filter(i => i.isGroup);

            if (list.length === 0) return api.sendMessage("📭 القائمة فارغة حالياً.", threadID);

            let msg = `📥 ━━ طلبات التحكم ━━\n`;
            list.forEach((s, i) => {
                msg += `\n🌟 [${i + 1}] ${s.name}\n🆔 ID: ${s.threadID}\n`;
            });
            msg += `\n━━━━━━━━━━━━━\n💡 للقبول: رد بالرقم\n💡 للرفض/الحظر: رد بـ (رفض/حظر + الرقم)\n✨ خاص بالمطور فقط`;

            return api.sendMessage(
                msg,
                threadID,
                (err, info) => {
                    if (err) return console.error(err);
                    global.client.handleReply.push({
                        name: "الطلبات",
                        messageID: info.messageID,
                        author: senderID,
                        pending: list
                    });
                },
                messageID
            );

        } catch (error) {
            console.error("خطأ في onStart:", error);
            return api.sendMessage("❌ فشل في جلب البيانات.", threadID, messageID);
        }
    }
};

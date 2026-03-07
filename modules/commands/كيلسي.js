const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");

// تهيئة العقل الذكي
const genAI = new GoogleGenerativeAI("AIzaSyBAl2t8mMUIXovEkOAYQcV23MlmoEmA320");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

module.exports = {
    config: {
        name: "كيلسي", // اسم الأمر: /fix
        version: "1.0.0",
        role: 2, // للآدمن فقط (سينكو) لحماية البوت
        author: "SINKO",
        description: "ذكاء اصطناعي لتعديل وإصلاح الكود من الداخل",
        category: "owner",
        guide: "{pn} [اسم الملف] [المشكلة أو الطلب]"
    },

    onStart: async function ({ api, event, args }) {
        const adminID = "100088214156174"; // الـ ID حقك
        if (event.senderID !== adminID) return api.sendMessage("❌ | الصلاحية للمطور سينكو فقط!", event.threadID);

        const fileName = args[0]; // اسم الملف المراد تعديله (مثلاً test.js)
        const userRequest = args.slice(1).join(" "); // الطلب (مثلاً: أصلح خطأ الأقواس)

        if (!fileName || !userRequest) return api.sendMessage("⚠️ | الاستخدام: /fix [اسم_الملف] [المشكلة]", event.threadID);

        const filePath = path.join(__dirname, fileName);

        if (!fs.existsSync(filePath)) return api.sendMessage("🚫 | الملف ده ما لقيتو في مجلد الأوامر!", event.threadID);

        try {
            const oldCode = fs.readFileSync(filePath, "utf-8");
            api.sendMessage("⚙️ | جاري تحليل الكود وإصلاحه...", event.threadID);

            const prompt = `أنت مطور Node.js خبير. هذا هو كود ملف اسمه ${fileName}:\n\n${oldCode}\n\nالمطلوب: ${userRequest}\n\nقم برد الكود كاملاً ومصححاً فقط دون كلام جانبي.`;

            const result = await model.generateContent(prompt);
            const newCode = result.response.text().replace(/```javascript|```/g, ""); // تنظيف الرد

            // كتابة الكود الجديد في الملف
            fs.writeFileSync(filePath, newCode, "utf-8");

            api.sendMessage(`✅ | تم إصلاح وتحديث الملف [${fileName}] بنجاح!\nجرب تشغل البوت تاني.`, event.threadID);
        } catch (error) {
            api.sendMessage("❌ | حصل خطأ أثناء محاولة الوصول للعقل المدبر.", event.threadID);
        }
    }
};

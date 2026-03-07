const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");

// تهيئة العقل الذكي (Gemini)
const genAI = new GoogleGenerativeAI("AIzaSyBAl2t8mMUIXovEkOAYQcV23MlmoEmA320");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // استخدمت فلاش لأنه أسرع وأذكى في البرمجة

module.exports = {
    config: {
        name: "ky",
        version: "2.0.0",
        role: 2, // للمطور (سينكو) فقط
        author: "SINKO",
        description: "المهندس التقني: ذكاء اصطناعي للمحادثة وإصلاح الملفات من الداخل",
        category: "owner",
        guide: {
            en: "{pn} [اسم الملف] [الطلب] أو {pn} [نص المحادثة]"
        }
    },

    conversations: new Map(), // نظام الذاكرة مثل أمر ابلين

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID: userId } = event;
        const adminID = "61588108307572"; // الـ ID الخاص بك (سينكو)

        // حماية الأمر: الصلاحية للمطور فقط
        if (userId !== adminID) {
            return api.sendMessage("⚠️ | عذراً، هذا الأمر مخصص للإدارة الفنية فقط.", threadID, messageID);
        }

        const query = args.join(" ").trim();
        if (!query) {
            return api.sendMessage("•-• مرحباً بك يا باشمهندس سينكو. كيف يمكنني مساعدتك في تطوير البوت اليوم؟", threadID, messageID);
        }

        // --- نظام التفاعل (Reactions) رسمي ---
        api.setMessageReaction("⚙️", messageID, (err) => {}, true);

        try {
            // التحقق إذا كان الطلب يتعلق بملف موجود في مجلد الأوامر
            const fileName = args[0];
            const filePath = path.join(__dirname, fileName);
            let isFileOperation = false;
            let fileContent = "";

            if (fileName.endsWith('.js') && fs.existsSync(filePath)) {
                isFileOperation = true;
                fileContent = fs.readFileSync(filePath, "utf-8");
            }

            // --- نظام الذاكرة والمحادثة ---
            if (!this.conversations.has(userId)) {
                this.conversations.set(userId, []);
            }
            const history = this.conversations.get(userId);

            // بناء الـ Prompt
            let systemInstruction = "أنت مساعد تقني ذكي وخبير في برمجة البوتات (Node.js). ردودك رسمية، دقيقة، ومباشرة. ";
            if (isFileOperation) {
                systemInstruction += `أنت الآن تقوم بتعديل ملف برمجى اسمه: ${fileName}. قم بتقديم الكود المحدث فقط داخل علامات الكود.`;
            }

            const userPrompt = isFileOperation 
                ? `هذا هو الكود الحالي للملف ${fileName}:\n\n${fileContent}\n\nالمطلوب: ${args.slice(1).join(" ")}`
                : query;

            // إضافة الطلب للذاكرة
            history.push({ role: "user", parts: [{ text: userPrompt }] });

            // إرسال رسالة انتظار
            const infoMsg = await api.sendMessage(isFileOperation ? "🔍 جاري تحليل الكود وتطبيق التعديلات..." : "🔄 جاري المعالجة...", threadID, messageID);

            // استدعاء Gemini
            const chat = model.startChat({
                history: history.slice(0, -1), // إرسال التاريخ ما عدا الطلب الأخير
                generationConfig: { maxOutputTokens: 2000 },
            });

            const result = await chat.sendMessage(userPrompt);
            const responseText = result.response.text();

            // إذا كانت عملية تعديل ملف، نقوم بحفظ الكود الجديد
            if (isFileOperation) {
                const cleanedCode = responseText.replace(/```javascript|```js|```/g, "").trim();
                fs.writeFileSync(filePath, cleanedCode, "utf-8");
                
                await api.editMessage(`✅ تم تحديث الملف [${fileName}] بنجاح.\n\nملخص التعديل: تم تطبيق التغييرات المطلوبة برمجياً.`, infoMsg.messageID);
            } else {
                // محادثة عادية
                await api.editMessage(`•-• ${responseText}`, infoMsg.messageID);
            }

            // حفظ الرد في الذاكرة (للمحادثات العادية)
            if (!isFileOperation) {
                history.push({ role: "model", parts: [{ text: responseText }] });
                if (history.length > 10) history.shift(); // الحفاظ على ذاكرة قصيرة لتجنب الثقل
            }

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | حدث خطأ تقني أثناء معالجة الطلب. يرجى مراجعة سجلات Terminal.", threadID, messageID);
        }
    }
};

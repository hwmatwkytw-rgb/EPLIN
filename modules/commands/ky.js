const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs-extra");
const path = require("path");

const genAI = new GoogleGenerativeAI("AIzaSyBAl2t8mMUIXovEkOAYQcV23MlmoEmA320");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

module.exports = {
    config: {
        name: "ky",
        version: "2.1.0",
        role: 2,
        author: "SINKO",
        description: "المهندس التقني: معدل ملفات الأحداث والأوامر داخل المودلس",
        category: "owner",
        guide: "{pn} [اسم_الملف] [الطلب]"
    },

    conversations: new Map(),

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID: userId } = event;
        const adminID = "61588108307572"; 

        if (userId !== adminID) return api.sendMessage("⚠️ | الصلاحية للمطور سينكو فقط.", threadID, messageID);

        const query = args.join(" ").trim();
        if (!query) return api.sendMessage("•-• مرحباً باشمهندس سينكو. حدد الملف (في الأوامر أو الأحداث) والطلب.", threadID, messageID);

        api.setMessageReaction("⚙️", messageID, () => {}, true);

        try {
            const fileName = args[0];
            
            // --- تحديد المسارات بناءً على هيكلة بوتك ---
            const commandsPath = path.join(process.cwd(), "modules", "commands", fileName);
            const eventsPath = path.join(process.cwd(), "modules", "الاحداث", fileName); // تأكد من اسم المجلد "الاحداث" بالظبط

            let filePath = "";
            if (fs.existsSync(commandsPath)) {
                filePath = commandsPath;
            } else if (fs.existsSync(eventsPath)) {
                filePath = eventsPath;
            }

            const isFileOperation = filePath !== "" && fileName.endsWith('.js');

            if (!this.conversations.has(userId)) this.conversations.set(userId, []);
            const history = this.conversations.get(userId);

            let systemInstruction = "أنت مهندس برمجيات خبير في هيكلة بوتات ماسنجر. ";
            if (isFileOperation) systemInstruction += `تعدل الآن ملفاً في مسار: ${filePath}. ركز على جودة الكود.`;

            const userPrompt = isFileOperation 
                ? `كود الملف الحالي:\n\n${fs.readFileSync(filePath, "utf-8")}\n\nالمطلوب: ${args.slice(1).join(" ")}`
                : query;

            history.push({ role: "user", parts: [{ text: userPrompt }] });

            const infoMsg = await api.sendMessage(isFileOperation ? `🔍 جاري تعديل [${fileName}]...` : "🔄 جاري التفكير...", threadID, messageID);

            const chat = model.startChat({ history: history.slice(0, -1) });
            const result = await chat.sendMessage(userPrompt);
            const responseText = result.response.text();

            if (isFileOperation) {
                const cleanedCode = responseText.replace(/```javascript|```js|```/g, "").trim();
                fs.writeFileSync(filePath, cleanedCode, "utf-8");
                await api.editMessage(`✅ تم تحديث الملف في مجلد ${filePath.includes("commands") ? "الكوماندس" : "الأحداث"} بنجاح.`, infoMsg.messageID);
            } else {
                await api.editMessage(`•-• ${responseText}`, infoMsg.messageID);
                history.push({ role: "model", parts: [{ text: responseText }] });
            }

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | فشلت العملية. تأكد من أسماء المجلدات (modules/commands/الاحداث).", threadID, messageID);
        }
    }
};

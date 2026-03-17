const axios = require("axios");

// دالة تحويل الأكواد (نفس منطق كودك الأصلي)
function GetActions(ActionCode) {
    const ActionsMap = {
        "u1": "upsample1", "u2": "upsample2", "u3": "upsample3", "u4": "upsample4",
        "v1": "variation1", "v2": "variation2", "v3": "variation3", "v4": "variation4",
        "🔁": "reroll"
    };
    return ActionsMap[ActionCode] || "Invalid action";
}

function MapActions(ActionsArray) {
    const Codes = {
        "upsample1": "u1", "upsample2": "u2", "upsample3": "u3", "upsample4": "u4",
        "variation1": "v1", "variation2": "v2", "variation3": "v3", "variation4": "v4",
        "reroll": "🔁"
    };
    return ActionsArray.map(action => Codes[action] || action);
}

module.exports = {
    config: {
        name: "عدل",
        version: "5.0",
        author: "AbuUbaida",
        countDown: 10,
        role: 0,
        category: "ذكاء اصطناعي",
        guide: "{pn} [وصف الصورة]"
    },

    onStart: async function ({ api, event, args }) {
        let prompt = args.join(" ");
        if (!prompt) return api.sendMessage("⚠️ | يا ملك، أكتب وصف للصورة!", event.threadID, event.messageID);

        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);

            // نداء الـ API المباشر (بدل السكرابر)
            // ملاحظة: استخدمت سيرفر Sandip لأنه بيدعم الـ image_id والـ actions
            const res = await axios.get(`https://api.sandipbaruwal.com/midjourney?prompt=${encodeURIComponent(prompt)}`);
            const image = res.data;

            if (!image || !image.raw_image_url) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return api.sendMessage("❌ | السيرفر مضغوط، جرب تاني.", event.threadID);
            }

            const imageStream = (await axios.get(image.raw_image_url, { responseType: "stream" })).data;
            const Ac = MapActions(image.actions || ["u1", "u2", "v1", "v2"]);
            
            const info = await api.sendMessage({
                body: "✅ | تم الانتهاء بنجاح ✨\n\nرد بـ (U1, V1...) للتعديل:\n" + Ac.map(item => item.toUpperCase()).join(', '),
                attachment: imageStream
            }, event.threadID, event.messageID);

            // تسجيل الرد في نظام ابلين
            global.client.handleReply.push({
                name: "ميدجورني",
                messageID: info.messageID,
                author: event.senderID,
                ImageID: image.image_id,
                Actions: image.actions || ["upsample1", "upsample2", "variation1", "variation2"]
            });

            api.setMessageReaction("✅", event.messageID, () => {}, true);
        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | حصل خطأ في الاتصال بالسيرفر.", event.threadID);
        }
    },

    onReply: async function ({ api, event, handleReply }) {
        const { author, ImageID, Actions } = handleReply;
        if (event.senderID !== author) return;

        const userSelection = event.body.trim().toLowerCase();
        const actionMapped = GetActions(userSelection);

        if (actionMapped === "Invalid action") return;

        try {
            api.setMessageReaction("⚙️", event.messageID, () => {}, true);
            api.sendMessage("⚠️ | جاري تعديل الصورة، انتظر ثواني...", event.threadID, event.messageID);

            // نداء الـ API للتعديل (Action)
            const res = await axios.get(`https://api.sandipbaruwal.com/midjourney/action?action=${actionMapped}&image_id=${ImageID}`);
            const Image = res.data;

            const imageStream = (await axios.get(Image.raw_image_url, { responseType: "stream" })).data;
            
            const info = await api.sendMessage({
                body: `✅ | تم التعديل: ${userSelection.toUpperCase()}`,
                attachment: imageStream
            }, event.threadID, event.messageID);

            // تحديث بيانات الرد للمرة الجاية
            global.client.handleReply.push({
                name: "عدل",
                messageID: info.messageID,
                author: event.senderID,
                ImageID: Image.image_id,
                Actions: Image.actions
            });
            api.setMessageReaction("✅", event.messageID, () => {}, true);

        } catch (error) {
            api.sendMessage("❌ | فشلت عملية التعديل.", event.threadID);
        }
    }
};

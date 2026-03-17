const axios = require("axios");

// وظائف مساعدة للتحويل بين الأكواد والأكشن
function GetActions(ActionCode) {
    const ActionsMap = {
        "us1": "upsample_subtle", "us2": "upsample_creative",
        "lv": "low_variation", "hv": "high_variation",
        "zo2": "zoom_out_2x", "zo1.5": "zoom_out_1_5x",
        "sq": "square", "pl": "pan_left", "pr": "pan_right",
        "pu": "pan_up", "pd": "pan_down",
        "u1": "upsample1", "u2": "upsample2", "u3": "upsample3", "u4": "upsample4",
        "🔁": "reroll", "v1": "variation1", "v2": "variation2", "v3": "variation3", "v4": "variation4"
    };
    return ActionsMap[ActionCode.toLowerCase()] || "Invalid action";
}

function MapActions(ActionsArray) {
    const Codes = {
        "upsample_subtle": "us1", "upsample_creative": "us2",
        "low_variation": "lv", "high_variation": "hv",
        "zoom_out_2x": "zo2", "zoom_out_1_5x": "zo1.5",
        "square": "sq", "pan_left": "pl", "pan_right": "pr",
        "pan_up": "pu", "pan_down": "pd",
        "upsample1": "u1", "upsample2": "u2", "upsample3": "u3", "upsample4": "u4",
        "reroll": "🔁", "variation1": "v1", "variation2": "v2", "variation3": "v3", "variation4": "v4"
    };
    return ActionsArray.map(action => Codes[action] || action);
}

module.exports = {
    config: {
        name: "عدل",
        version: "1.0",
        author: "AbuUbaida x ابلين",
        countDown: 10,
        role: 0,
        category: "ai",
        guide: "{pn} [النص]"
    },

    onStart: async function ({ api, event, args }) {
        let prompt = args.join(" ");
        
        // التعامل مع الصور المرفقة (SREF)
        if (event.type === "message_reply" && event.messageReply.attachments?.[0]?.type === "photo") {
            const image = event.messageReply.attachments[0].url;
            prompt = `${prompt} --sref ${image}`;
        }

        if (!prompt) return api.sendMessage("⚠️ | يا رمة أكتب وصف للصورة الدايرني أتخيلها ليك!", event.threadID, event.messageID);

        try {
            api.setMessageReaction("🧭", event.messageID, () => {}, true);
            
            // استدعاء السكرابر (تأكد إن السكرابر ده معرف في البوت عندك)
            const Mid = new global.scraper.MidJourney();
            const image = await Mid.Generate(prompt);

            if (!image || !image.raw_image_url) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return api.sendMessage("❌ | السيرفر معلق، جرب تاني يا بطل.", event.threadID);
            }

            const Ac = MapActions(image.actions);
            const imageStream = await global.utils.getStreamFromURL(image.raw_image_url);

            const info = await api.sendMessage({
                body: `✅ | ابلين جهزت ليك الصورة ✨\n\nعشان تعدل، رد على الرسالة دي بـ:\n[ ${Ac.map(item => item.toUpperCase()).join(' - ')} ]`,
                attachment: imageStream
            }, event.threadID);

            // حفظ البيانات للرد (Reply)
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                ImageID: image.image_id,
                Actions: image.actions
            });

            api.setMessageReaction("✅", event.messageID, () => {}, true);
        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | حصل كلاش في توليد الصورة.", event.threadID);
        }
    },

    onReply: async function ({ api, event, handleReply }) {
        const { author, ImageID, Actions } = handleReply;
        if (event.senderID !== author) return;

        const userSelection = event.body.trim().toLowerCase();
        const options = MapActions(Actions);

        if (!options.includes(userSelection)) {
            return api.sendMessage(`⚠️ | اختيارك غلط! اختار من ديل: ${options.map(i => i.toUpperCase()).join(', ')}`, event.threadID, event.messageID);
        }

        try {
            api.setMessageReaction("⚙️", event.messageID, () => {}, true);
            api.sendMessage("⏳ | جاري تعديل الصورة.. خليك قريب يا بطل.", event.threadID, event.messageID);

            const Mid = new global.scraper.MidJourney();
            const Image = await Mid.Action({ action: GetActions(userSelection), image_id: ImageID });

            const options2 = MapActions(Image.actions);
            const imageStream = await global.utils.getStreamFromURL(Image.raw_image_url);

            const info = await api.sendMessage({
                body: `✅ | تم التعديل: ${userSelection.toUpperCase()}\n\nتعديلات تانية؟\n[ ${options2.map(i => i.toUpperCase()).join(' - ')} ]`,
                attachment: imageStream
            }, event.threadID);

            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                ImageID: Image.image_id,
                Actions: Image.actions
            });

            api.setMessageReaction("✔️", event.messageID, () => {}, true);
        } catch (error) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            api.sendMessage("❌ | فشلت في تعديل الصورة.", event.threadID);
        }
    }
};

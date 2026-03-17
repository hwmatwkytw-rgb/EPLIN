const axios = require("axios");

class MidJourney {
    async Generate(prompt) {
        try {
            // استخدام API قوي ومجاني ومباشر
            const res = await axios.get(`https://api.samir.xyz/ai/midjourney?prompt=${encodeURIComponent(prompt)}`);
            
            // تحويل النتيجة لشكل يفهمه كود الأمر بتاعك
            return {
                raw_image_url: `https://api.samir.xyz/ai/midjourney?prompt=${encodeURIComponent(prompt)}`,
                image_id: Math.random().toString(36).substring(7),
                actions: ["u1", "u2", "v1", "v2"] // خيارات وهمية للتحسين
            };
        } catch (error) {
            console.error("خطأ في سكرابر ميدجورني:", error);
            return null;
        }
    }

    async Action({ action, image_id }) {
        // وظيفة الأكشن (التعديل) لو حابب تضيفها لاحقاً
        return null;
    }
}

module.exports = MidJourney;

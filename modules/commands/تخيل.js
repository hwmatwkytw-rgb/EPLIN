const axios = require("axios");

// --- وظائف الـ API المدمجة ---
function randomstr(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function getCookies() {
    const response = await axios.get("https://chataibot.pro/api/landing/hello");
    return response.headers['set-cookie'].join('; ');
}

async function regester(email, password, cookies) {
    let data = {
        "email": email,
        "password": password,
        "isAdvertisingAccepted": true,
        "mainSiteUrl": "https://chataibot.pro/api"
    };
    return (await axios.post('https://chataibot.pro/api/register', data, { 
        headers: { 'Cookie': cookies, 'Content-Type': 'application/json' } 
    })).data;
}

async function getCode(userName) {
    let attempt = 0;
    while(attempt < 15) { // محاولة لمدة 30 ثانية تقريباً
        let mails = (await axios.post('http://temp.ly/api/emails', { "username": userName, "domain": "temp.ly" })).data.emails;
        if (mails && mails.length > 0) {
            const match = mails[0].body.match(/Your code:\s*(\d{6})/);
            if (match) return match[1];
        }
        await new Promise(r => setTimeout(r, 2000));
        attempt++;
    }
    throw new Error("Timeout waiting for code");
}

async function Verify(email, code, cookie) {
    let data = { "email": email, "token": code };
    return (await axios.post('https://chataibot.pro/api/register/verify', data, { 
        headers: { 'Cookie': cookie, 'Content-Type': 'application/json' } 
    })).data;
}

async function generateMJ(prompt, cookie) {
    let data = { "text": prompt, "from": 1, "generationType": "MIDJOURNEY", "version": "7" };
    return (await axios.post('https://chataibot.pro/api/image/generate', data, { 
        headers: { 'Cookie': cookie, 'Content-Type': 'application/json' } 
    })).data;
}

// --- إعدادات الأمر للبوت ---
module.exports = {
  config: {
    name: "تخيل",
    version: "1.1.0",
    author: "SINKO",
    countDown: 15,
    role: 0,
    category: "AI"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) return api.sendMessage("أدخل وصف الصورة يا ملك 🎨", threadID, messageID);

    // تفاعل البدء
    api.setMessageReaction("🎨", messageID, () => {}, true);

    try {
        const username = randomstr(8).toLowerCase();
        const email = username + "@temp.ly";
        const password = randomstr(10);
        
        // تنفيذ عملية التسجيل والتوكن
        let cookies = await getCookies();
        await regester(email, password, cookies);
        const code = await getCode(username);
        const verifyData = await Verify(email, code, cookies);
        
        // تحديث الكوكيز بالتوكن الجديد
        const finalCookies = `${cookies}; token=${verifyData.jwtToken}`;
        
        // طلب الرسم
        const result = await generateMJ(prompt, finalCookies);
        
        if (!result.images || result.images.length === 0) {
            throw new Error("No images generated");
        }

        const imgUrl = result.images[0];

        // إرسال الصورة كـ Stream لضمان العمل في راندر
        const stream = (await axios.get(imgUrl, { responseType: "stream" })).data;

        return api.sendMessage({
            body: `تـم الـرسـم بـنـجـاح ✅\nالـوصـف: ${prompt}`,
            attachment: stream
        }, threadID, messageID);

    } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("حدث خطأ أثناء الرسم أو الخدمة مضغوطة حالياً، حاول مرة أخرى يا ملك.", threadID, messageID);
    }
  }
};

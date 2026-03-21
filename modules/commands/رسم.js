const axios = require("axios");

// --- بداية الـ API المباشر ---
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
    return (await axios.post('https://chataibot.pro/api/register', data, { headers: { 'Cookie': cookies } })).data;
}

async function getCode(userName) {
    while(true) {
        let mails = (await axios.post('http://temp.ly/api/emails', { "username": userName, "domain": "temp.ly" })).data.emails;
        if (mails.length > 0) {
            const match = mails[0].body.match(/Your code:\s*(\d{6})/);
            if (match) return match[1];
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

async function Verify(email, code, cookie) {
    let data = { "email": email, "token": code };
    return (await axios.post('https://chataibot.pro/api/register/verify', data, { headers: { 'Cookie': cookie } })).data;
}

async function generateMJ(prompt, cookie) {
    let data = { "text": prompt, "from": 1, "generationType": "MIDJOURNEY", "version": "7" };
    return (await axios.post('https://chataibot.pro/api/image/generate', data, { headers: { 'Cookie': cookie } })).data;
}

// --- نهاية الـ API ---

module.exports = {
  config: {
    name: "رسم",
    version: "1.0.0",
    author: "SINKO",
    countDown: 10,
    role: 0,
    category: "AI"
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("أدخل وصف الصورة يا ملك 🎨", event.threadID, event.messageID);

    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    try {
        const username = randomstr(8).toLowerCase();
        const email = username + "@temp.ly";
        const password = randomstr(10);
        
        let cookies = await getCookies();
        await regester(email, password, cookies);
        const code = await getCode(username);
        const verifyData = await Verify(email, code, cookies);
        cookies += `; token=${verifyData.jwtToken}`;
        
        const result = await generateMJ(prompt, cookies);
        const imgUrl = result.images[0];

        return api.sendMessage({
            body: `تـم الـرسـم بـنـجـاح ✅\nالـوصـف: ${prompt}`,
            attachment: await global.funcs.getStream(imgUrl)
        }, event.threadID, event.messageID);

    } catch (e) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("الـ API مـضـغـوط حالياً، جرب مرة أخرى.", event.threadID);
    }
  }
};

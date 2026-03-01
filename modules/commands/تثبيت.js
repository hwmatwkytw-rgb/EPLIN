const axios = require('axios');
const fs = require('fs-extra');
const request = require('request');
const cheerio = require('cheerio');
const { join } = require("path");

module.exports = {
    config: {
        name: "تثبيت",
        version: "1.0.0",
        author: "سينكو",
        countDown: 0,
        prefix: true,
        category: "owner",
        description: "سحب الأكواد من روابط Pastebin أو Buildtool وحفظها كملفات",
        guide: {
            en: "{pn} [اسم الملف] (مع الرد على الرابط)"
        }
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, messageReply, type } = event;
        
        var name = args[0];
        var text = (type == "message_reply") ? messageReply.body : null;

        if (!text && !name) {
            return api.sendMessage('⚠️ يرجى الرد على رابط الكود أو كتابة اسم الملف المراد رفعه.', threadID, messageID);
        }

        if (!text && name) {
            const filePath = join(__dirname, `${name}.js`);
            if (!fs.existsSync(filePath)) {
                return api.sendMessage(`❌ الملف (${name}.js) غير موجود في مجلد الأوامر.`, threadID, messageID);
            }

            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const { PasteClient } = require('pastebin-api');
                const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");

                const url = await client.createPaste({
                    code: content,
                    expireDate: 'N',
                    format: "javascript",
                    name: name,
                    publicity: 1
                });

                var id = url.split('/')[3];
                return api.sendMessage(`✅ تم الرفع بنجاح:\nhttps://pastebin.com/raw/${id}`, threadID, messageID);
            } catch (err) {
                return api.sendMessage(`❌ حدث خطأ أثناء عملية الرفع.`, threadID, messageID);
            }
        }

        var urlR = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        var urlMatch = text.match(urlR);
        if (!urlMatch) return api.sendMessage('⚠️ الرابط المقدم غير صالح.', threadID, messageID);
        var url = urlMatch[0];

        if (url.indexOf('pastebin') !== -1) {
            try {
                if (!url.includes('/raw/')) {
                    var id = url.split('/').pop();
                    url = `https://pastebin.com/raw/${id}`;
                }

                const response = await axios.get(url);
                const path = join(__dirname, `${name}.js`);

                fs.writeFileSync(path, response.data, "utf-8");
                return api.sendMessage(`✅ تم حفظ الكود في ملف: (${name}.js)\nيرجى إعادة تشغيل البوت لتفعيل الأمر.`, threadID, messageID);
            } catch (err) {
                return api.sendMessage(`❌ فشل سحب الكود من الرابط.`, threadID, messageID);
            }
        }

        if (url.indexOf('buildtool') !== -1 || url.indexOf('tinyurl.com') !== -1) {
            request(url, function (error, response, body) {
                if (error) return api.sendMessage('❌ حدث خطأ أثناء تحميل الرابط.', threadID, messageID);
                
                const $ = cheerio.load(body);
                $('.language-js').each((index, el) => {
                    if (index !== 0) return;
                    var code = el.children[0].data;
                    const path = join(__dirname, `${name}.js`);
                    fs.writeFileSync(path, code, "utf-8");
                    return api.sendMessage(`✅ تم استخراج الكود وحفظه في: (${name}.js)`, threadID, messageID);
                });
            });
            return;
        }

        if (url.indexOf('drive.google') !== -1) {
            var driveID = url.match(/[-\w]{25,}/);
            const path = join(__dirname, `${name}.js`);
            try {
                const response = await axios({
                    method: 'GET',
                    url: `https://drive.google.com/u/0/uc?id=${driveID}&export=download`,
                    responseType: 'arraybuffer'
                });
                fs.writeFileSync(path, Buffer.from(response.data), "utf-8");
                return api.sendMessage(`✅ تم تحميل وحفظ الملف من Google Drive باسم: (${name}.js)`, threadID, messageID);
            } catch(e) {
                return api.sendMessage(`❌ فشل تحميل الملف من الرابط الموضح.`, threadID, messageID);
            }
        }
    }
};

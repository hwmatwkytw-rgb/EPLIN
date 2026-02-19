const fs = require('fs');
const path = require('path');
const axios = require('axios');
const fsExtra = require('fs-extra');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
const commandsPath = path.join(__dirname, '..', 'commands');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`خطأ في قراءة الملف ${filePath}:`, error);
        return {};
    }
}

async function downloadImage(url) {
    const tempPath = path.join(__dirname, 'temp_image.jpg');
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    fsExtra.writeFileSync(tempPath, response.data);
    return tempPath;
}

module.exports = {
    config: {
        name: 'اوامر',
        version: '5.0',
        author: 'Edited by Abu Obaida',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض قائمة الأوامر أو تفاصيل أمر محدد بزخرفة هندسية ملكية.',
        category: 'المجموعة',
        guide: {
            ar: '{pn}\n{pn} <اسم_الأمر>'
        },
    },

    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0];

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(path.join(commandsPath, file))];
                const command = require(path.join(commandsPath, file));

                if (command.config) {
                    commands[command.config.name.toLowerCase()] = command.config;

                    if (command.config.aliases) {
                        for (const alias of command.config.aliases) {
                            commands[alias.toLowerCase()] = command.config;
                        }
                    }
                }
            } catch (error) {
                console.error(`خطأ أثناء تحميل ${file}:`, error);
            }
        }

        const uniqueCommands = Object.values(commands)
            .filter((cmd, index, self) =>
                self.findIndex(c => c.name === cmd.name) === index
            );

        // =========================
        // عرض تفاصيل أمر (مزخرف)
        // =========================
        if (input) {
            const cmd = commands[input.toLowerCase()];

            if (!cmd) {
                return api.sendMessage(`ꕥ ┋ ❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage =
`╭━━━━〔 ꕥ تـفـاصـيـل ꕥ 〕━━━━╮

 𓆩 ꕥ 𓆪 الاسـم: 『 ${cmd.name} 』
 𓆩 ꕥ 𓆪 الـوصف: 『 ${cmd.description} 』
 𓆩 ꕥ 𓆪 الـمؤلف: 『 ${cmd.author} 』
 𓆩 ꕥ 𓆪 الـإصدار: 『 ${cmd.version} 』`;

            if (cmd.aliases?.length) {
                detailMessage += `\n. 𓆩 ☆ 𓆪 الـأسماء: 『 ${cmd.aliases.join(' , ')} 』`;
            }

            if (cmd.guide?.ar) {
                detailMessage += `\n. \n. 𓆩  𓆪 طـريقة الـاستخدام:\n┃ 〖 ${cmd.guide.ar.replace(/{pn}/g, config.prefix + cmd.name)} 〗`;
            }

            detailMessage += `\n┃\n. `;

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =========================
        // تصنيف الأوامر
        // =========================
        const categories = {};
        const categoryMap = {
            'group': 'المجموعة', 'image': 'الصور', 'media': 'الوسائط',
            'admin': 'الإدارة', 'fun': 'الترفيه', 'random': 'عشوائي',
            'music': 'الموسيقى', 'video': 'الفيديو', 'ai': 'الذكاء الاصطناعي',
            'tools': 'الأدوات', 'utility': 'الخدمات السريعة', 'owner': 'المطور',
            'level': 'المستوى', 'game': 'اللعب', 'play': 'اللعب',
        };

        for (const cmd of uniqueCommands) {
            let category = cmd.category || 'الترفيه';
            if (['اقتصاد', 'اللعب', 'game', 'play'].includes(category)) category = 'اللعب';
            if (category === 'owner' || category === 'المطور' || cmd.role === 2 || ['رستارت', 'إشعار'].includes(cmd.name)) category = 'المطور';
            
            category = categoryMap[category] || category;
            if (!categories[category]) categories[category] = [];
            categories[category].push(cmd.name);
        }

        const orderedCats = ['المجموعة', 'الصور', 'الوسائط', 'الذكاء الاصطناعي', 'الترفيه', 'اللعب', 'عشوائي', 'المطور', 'الأدوات'];

        // =========================
        // بناء القائمة (بالمربعات والورود النصية)
        // =========================
        let finalMessage = `ꕥ ─────────────── ꕥ\n`;
        finalMessage += `  𓆩 ♢ 𓆪  قـائمة الأوامـر  𓆩 ♢ 𓆪\n`;
        finalMessage += `ꕥ ─────────────── ꕥ\n\n`;

        for (const category of orderedCats) {
            const cmds = categories[category];
            if (!cmds || cmds.length === 0) continue;

            const adminList = config.adminUIDs || [];
            if (category === "المطور" && !adminList.includes(event.senderID)) continue;

            // المربع المحيط بالفئة
            finalMessage += `╭───〔 𓆩  ${category.toUpperCase()} 𓆪 〕──╮\n`;
            
            for (let i = 0; i < cmds.length; i += 3) {
                const row = cmds.slice(i, i + 3).map(c => `≛  ${c}`).join("  ");
                finalMessage += `┃ ${row}\n`;
            }

            finalMessage += `. \n\n`;
        }

        finalMessage += `ꕥ ─────────────── ꕥ\n`;
        finalMessage += ` عدد الأوامر: 『 ${uniqueCommands.length} 』\n`;
        finalMessage += `ꕥ  الــــــــمطوࢪ 〘 سينكو〙𓆩☆𓆪`;

        try {
            const imagePath = await downloadImage('https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg');
            return api.sendMessage({
                body: finalMessage.trim(),
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (err) {
            return api.sendMessage(finalMessage.trim(), event.threadID);
        }
    }
};

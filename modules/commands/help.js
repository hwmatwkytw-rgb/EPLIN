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
        description: 'عرض قائمة الأوامر أو تفاصيل أمر محدد بزخرفة الختم الماسي.',
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
        // عرض تفاصيل أمر (نمط رقم 5)
        // =========================
        if (input) {
            const cmd = commands[input.toLowerCase()];

            if (!cmd) {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage = `◈ ─── 𓊆 تـفـاصـيـل 𓊉 ─── ◈\n\n`;
            detailMessage += `✧ الاسـم: 『 ${cmd.name} 』\n`;
            detailMessage += `✧ الـوصف: 『 ${cmd.description} 』\n`;
            detailMessage += `✧ الـمؤلف: 『 ${cmd.author} 』\n`;
            detailMessage += `✧ الـإصدار: 『 ${cmd.version} 』\n`;

            if (cmd.aliases?.length) {
                detailMessage += `✧ الـأسماء: 『 ${cmd.aliases.join(' , ')} 』\n`;
            }

            if (cmd.guide?.ar) {
                detailMessage += `\n✧ طـريقة الـاستخدام:\n┃ 〖 ${cmd.guide.ar.replace(/{pn}/g, config.prefix + cmd.name)} 〗\n`;
            }

            detailMessage += `\n◈ ──────────────── ◈`;

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =========================
        // تصنيف الأوامر (نفس منطقك الأصلي)
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
        // بناء القائمة (النمط رقم 5 الماسي)
        // =========================
        let finalMessage = `◈ ─── ≛  قـائـمة الأوامـر ≛  ─── ◈\n\n`;

        for (const category of orderedCats) {
            const cmds = categories[category];
            if (!cmds || cmds.length === 0) continue;

            const adminList = config.adminUIDs || [];
            if (category === "المطور" && !adminList.includes(event.senderID)) continue;

            // شكل القسم والخط الفاصل (رقم 5)
            finalMessage += `✧ قـسـم ${category.toUpperCase()} :\n`;
            
            for (let i = 0; i < cmds.length; i += 3) {
                const row = cmds.slice(i, i + 3).map(c => `⬩ ${c}`).join("  ");
                finalMessage += `${row}\n`;
            }

            finalMessage += `━━━━━━━━━━━━━━━━━\n\n`;
        }

        finalMessage += `◈ ───────────────── ◈\n`;
        finalMessage += `│← عـدد الأوامـر ⠇${uniqueCommands.length}\n`;
        finalMessage += `│←\n`;
        finalMessage += `│← اسـتـمـتـع بـالـمـطـوࢪ 〖 سينكو 〗 𓆩☆𓆪`;

        try {
            const imagePath = await downloadImage('https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg');
            return api.sendMessage({
                body: finalMessage.trim(),
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => {
                if(fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });
        } catch (err) {
            return api.sendMessage(finalMessage.trim(), event.threadID);
        }
    }
};

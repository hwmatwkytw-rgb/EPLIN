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
        version: '5.6',
        author: 'سينكو',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض قائمة الأوامر بزخرفة المسار الطولي.',
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
        // تفاصيل أمر محدد
        // =========================
        if (input) {
            const cmd = commands[input.toLowerCase()];

            if (!cmd) {
                return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);
            }

            let detailMessage = `●───── ⌬ ─────●\n`;
            detailMessage += `┇ ⦿ ⟬ الإســم ⟭ : ${cmd.name}\n`;
            detailMessage += `┇ 𓋰 الـوصـف : ${cmd.description}\n`;
            detailMessage += `┇ 𓋰 الـمؤلـف : ${cmd.author}\n`;
            detailMessage += `┇ 𓋰 الـإصـدار : ${cmd.version}\n`;

            if (cmd.guide?.ar) {
                detailMessage += `┇\n┇ 𓋰 طريقة الاستخدام :\n┇ ⬩ ${cmd.guide.ar.replace(/{pn}/g, config.prefix + cmd.name)}\n`;
            }

            detailMessage += `●───── ⌬ ─────●`;

            return api.sendMessage(detailMessage, event.threadID);
        }

        // =========================
        // تصنيف الأوامر (نفس منطقك الأصلي تماماً)
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
        // بناء القائمة بالزخرفة الطولية
        // =========================
        let finalMessage = `●───── ⌬ ─────●\n┇\n`;

        for (let i = 0; i < orderedCats.length; i++) {
            const category = orderedCats[i];
            const cmds = categories[category];
            if (!cmds || cmds.length === 0) continue;

            const adminList = config.adminUIDs || [];
            if (category === "المطور" && !adminList.includes(event.senderID)) continue;

            finalMessage += `┇ ⦿ ⟬ قـسـم ${category.toUpperCase()} ⟭\n`;
            
            for (let j = 0; j < cmds.length; j += 3) {
                const row = cmds.slice(j, j + 3).map(c => `◍ ${c}`).join("  ");
                finalMessage += `┇ ${row}\n`;
            }
            finalMessage += `┇\n`;

            // إضافة الفاصل فقط إذا كان هناك قسم تالٍ
            if (i < orderedCats.length - 1) {
                finalMessage += `┝━━━━━━━━━━━━━━━\n┇\n`;
            }
        }

        finalMessage += `●───── ⌬ ─────●\n`;
        finalMessage += ` ⠇عـدد الأوامـر: ${uniqueCommands.length}\n`;
        finalMessage += ` ⠇الـمـطـوࢪ: سينكو 𓆩☆𓆪`;

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

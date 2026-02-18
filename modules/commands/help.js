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
        version: '7.0',
        author: 'Abu Obaida',
        countDown: 5,
        prefix: true,
        category: 'المجموعة',
        description: 'عرض قائمة الأوامر بتنسيق ملكي هادئ ومنظم.',
        guide: { ar: '{pn}\n{pn} <اسم_الأمر>' },
    },

    onStart: async ({ api, event, args }) => {
        const config = readDB(configPath);
        const input = args[0];
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        const commands = {};

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.config) {
                    commands[command.config.name.toLowerCase()] = command.config;
                    if (command.config.aliases) {
                        for (const alias of command.config.aliases) {
                            commands[alias.toLowerCase()] = command.config;
                        }
                    }
                }
            } catch (e) {}
        }

        const uniqueCommands = Object.values(commands).filter((cmd, index, self) =>
            self.findIndex(c => c.name === cmd.name) === index
        );

        if (input) {
            const cmd = commands[input.toLowerCase()];
            if (!cmd) return api.sendMessage(`ꕥ ┋ ❌ لم يتم العثور على الأمر "${input}"`, event.threadID);

            let detailMessage = `ꕥ ─── 〔 الـتـفـاصـيـل 〕 ─── ꕥ\n\n`;
            detailMessage += `♢ الاسـم: 『 ${cmd.name} 』\n`;
            detailMessage += `♢ الـوصف: 『 ${cmd.description} 』\n`;
            detailMessage += `♢ الـمؤلف: 『 ${cmd.author} 』\n`;
            if (cmd.guide?.ar) {
                detailMessage += `\n♢ طـريقة الـاستخدام:\n${cmd.guide.ar.replace(/{pn}/g, config.prefix + cmd.name)}\n`;
            }
            detailMessage += `\nꕥ ────────────────── ꕥ`;
            return api.sendMessage(detailMessage, event.threadID);
        }

        const categoryMap = {
            'group': 'الـمجموعة', 'image': 'الـصور', 'media': 'الـوسائط',
            'admin': 'الـإدارة', 'fun': 'الـترفيه', 'ai': 'الـذكاء',
            'owner': 'الـمطور', 'game': 'الـلعب'
        };

        const categories = {};
        for (const cmd of uniqueCommands) {
            let cat = categoryMap[cmd.category] || cmd.category || 'عـام';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.name);
        }

        const orderedCats = ['الـمجموعة', 'الـوسائط', 'الـذكاء', 'الـترفيه', 'الـلعب', 'الـمطور'];

        let finalMessage = `ꕥ ─── 𓆩 قـائمة الأوامـر 𓆪 ─── ꕥ\n\n`;

        for (const category of orderedCats) {
            const cmds = categories[category];
            if (!cmds || cmds.length === 0) continue;

            const adminList = config.adminUIDs || [];
            if (category === "الـمطور" && !adminList.includes(event.senderID)) continue;

            finalMessage += `[ 𓆩 ${category} 𓆪 ]\n`;
            finalMessage += `${cmds.join(' ♢ ')}\n\n`;
        }

        finalMessage += `ꕥ ────────────────── ꕥ\n`;
        finalMessage += `♢ الـعدد الـكلي: 『 ${uniqueCommands.length} 』\n`;
        finalMessage += `ꕥ ÆPłN To Pøt 𓆩 ♢ 𓆪`;

        try {
            const img = await downloadImage('https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg');
            return api.sendMessage({ body: finalMessage, attachment: fs.createReadStream(img) }, event.threadID, () => fs.unlinkSync(img));
        } catch {
            return api.sendMessage(finalMessage, event.threadID);
        }
    }
};

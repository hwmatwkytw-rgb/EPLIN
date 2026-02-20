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
        version: '5.5',
        author: 'سينكو',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'عرض قائمة الأوامر بالزخرفة الطولية الحديثة.',
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
                }
            } catch (error) {
                console.error(`خطأ في تحميل ${file}:`, error);
            }
        }

        const uniqueCommands = Object.values(commands).filter((cmd, index, self) =>
            self.findIndex(c => c.name === cmd.name) === index
        );

        // =========================
        // تفاصيل أمر واحد (ستايلك المختار)
        // =========================
        if (input) {
            const cmd = commands[input.toLowerCase()];
            if (!cmd) return api.sendMessage(`❌ لم يتم العثور على الأمر "${input}"`, event.threadID);

            let detailMsg = `●───── ⌬ ─────●\n`;
            detailMsg += `┇ ⦿ ⟬ الإســم ⟭ : ${cmd.name}\n`;
            detailMsg += `┇ 𓋰 الـوصـف : ${cmd.description}\n`;
            detailMsg += `┇ 𓋰 الـمؤلـف : ${cmd.author}\n`;
            detailMsg += `┇ 𓋰 الـفئـة : ${cmd.category}\n`;
            if (cmd.guide?.ar) {
                detailMsg += `┇ 𓋰 طريقة الاستخدام :\n┇ ${cmd.guide.ar.replace(/{pn}/g, config.prefix + cmd.name)}\n`;
            }
            detailMsg += `●───── ⌬ ─────●`;
            return api.sendMessage(detailMsg, event.threadID);
        }

        // =========================
        // تصنيف الأوامر
        // =========================
        const categories = {};
        for (const cmd of uniqueCommands) {
            let cat = cmd.category || 'عام';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.name);
        }

        // =========================
        // بناء القائمة الرئيسية (ستايلك المختار)
        // =========================
        let helpMsg = `●───── ⌬ ─────●\n┇\n`;

        for (const cat in categories) {
            helpMsg += `┇ ⦿ ⟬ قـسـم ${cat.toUpperCase()} ⟭\n`;
            const row = categories[cat].map(c => `⬩ ${c}`).join(" ");
            helpMsg += `┇ ${row}\n┇\n`;
        }

        helpMsg += `●───── ⌬ ─────●\n`;
        helpMsg += ` ⠇عـدد الأوامـر: ${uniqueCommands.length}\n`;
        helpMsg += ` ⠇الـمـطـوࢪ: سينكو 𓆩☆𓆪`;

        try {
            const imagePath = await downloadImage('https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg');
            return api.sendMessage({
                body: helpMsg,
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (err) {
            return api.sendMessage(helpMsg, event.threadID);
        }
    }
};

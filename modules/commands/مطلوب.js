const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'مطلوب',
        version: '1.0',
        author: 'Hridoy',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'Creates a wanted poster using a user avatar or replied image.',
        category: 'fun',
        guide: {
            en: '{pn}wanted\n{pn}wanted @someone\n{pn}wanted <uid>\nReply to an image with {pn}wanted'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply } = event;

        let targetID = senderID;
        let imageUrl = null;
        let targetIDForFilename = senderID;

     
        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
            imageUrl = messageReply.attachments[0].url;
            targetIDForFilename = messageReply.senderID;
        } else {
           
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else if (args.length > 0 && args[0].match(/^\d+$/)) {
                targetID = args[0].replace(/[^0-9]/g, '');
            }
            targetIDForFilename = targetID;

            
            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        const apiUrl = `https://sus-apis-2.onrender.com/api/wanted-poster?image=${encodeURIComponent(imageUrl)}`;

        try {
            api.sendMessage("📜 Creating wanted poster, please wait...", event.threadID);
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir);
            }
            const imagePath = path.join(cacheDir, `wanted_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => fs.unlinkSync(imagePath));
        } catch (error) {
            console.error("Error generating wanted poster:", error);
            api.sendMessage("❌ Couldn't generate the wanted poster right now.", event.threadID);
        }
    }
};

const fs = require('fs-extra');
const express = require('express');
const login = require('fca-priyansh');
const { loadCommands, handleCommand } = require('./handler/command');
const handleEvent = require('./handler/event');
const { handleMessage } = require('./handler/message');
const { log } = require('./logger/logger');
const config = require('./config/config.json');
const chalk = require('chalk');
const axios = require('axios');

const app = express();
app.use(express.static('public'));

app.get('/config', (req, res) => {
  res.json(config);
});

app.get('/command-count', (req, res) => {
  res.json({ count: global.client && global.client.commands ? global.client.commands.size : 0 });
});

const gradient = chalk.bold.green;

// --- دالة البانر ---
const displayBanner = async () => {
  try {
    const res = await axios.get('https://raw.githubusercontent.com/1dev-hridoy/1dev-hridoy/refs/heads/main/kenji.txt');
    const banner = Buffer.from(res.data, 'base64').toString('utf8');
    console.log(gradient(banner));
  } catch (err) {
    console.error('Failed to fetch banner:', err);
  }
};

const initializeBot = async () => {
  await displayBanner();
  console.log(chalk.bold.cyan('Loading commands...'));

  try {
    if (!fs.existsSync('./appstate.json')) {
      log('error', 'appstate.json not found.');
      process.exit(1);
    }
    const appState = fs.readJsonSync('./appstate.json');

    let api;
    try {
      api = await new Promise((resolve, reject) => {
        login({ appState }, (err, api) => {
          if (err) return reject(err);
          resolve(api);
        });
      });
    } catch (error) {
      log('error', `Login failed: ${error.message}`);
      process.exit(1);
    }

    api.setOptions({ listenEvents: true, selfListen: true, forceLogin: true });

    global.client = {
      handleReply: [],
      commands: new Map(),
      events: new Map(),
      config: config 
    };

    const commands = loadCommands();
    commands.forEach((cmd, name) => global.client.commands.set(name, cmd));

    // --- الاستماع للأحداث (Listening) ---
    api.listenMqtt(async (err, event) => {
      if (err) {
        log('error', `Event listener error: ${err.message}`);
        return;
      }

      // 🧠 [ 1. مراقب الذكاء الاصطناعي - المساعد الشخصي ]
      // بيشتغل لو الرسالة نصية ومن المطور (بابا)
      const aiWatcher = global.client.commands.get("مراقب_الذكاء");
      if (aiWatcher && event.body) {
        aiWatcher.handleEvent({ api, event });
      }

      // 🎧 [ 2. رادار ابلين للصوت ]
      if ((event.type === 'message' || event.type === 'message_reply') && event.attachments && event.attachments.length > 0) {
        if (event.attachments[0].type === "audio") {
          const voiceCmd = global.client.commands.get("ابلين_صوت");
          if (voiceCmd && voiceCmd.handleEvent) {
             voiceCmd.handleEvent({ api, event });
          }
        }
      }

      if (event.type === 'event') {
        await handleEvent(event, api);
      } else if (event.type === 'message' || event.type === 'message_reply') {
        const time = new Date().toLocaleTimeString();
        console.log(gradient(`[${time}] New Activity Detected`));

        // تمرير الرسالة لنظام الأوامر العادي (للمستخدمين الباقين)
        await handleMessage(event, api, commands);
      }
    });

    log('info', 'Eplin AI System & Voice Radar: ONLINE');

    if (fs.existsSync('./restart.json')) {
      const restartInfo = fs.readJsonSync('./restart.json');
      api.sendMessage(`تم اعادة تشغيل ابلين يا بابا 🔂❤️.`, restartInfo.threadID);
      fs.removeSync('./restart.json');
    }

    process.on('SIGINT', () => {
      log('info', 'Bot stopped');
      process.exit(0);
    });

  } catch (error) {
    log('error', `Bot initialization error: ${error.message}`);
    process.exit(1);
  }
};

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  log('info', `Web server running on port ${port}`);
});

initializeBot();

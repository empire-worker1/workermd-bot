const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_NUMBER = '24104160140';
const CREATOR = 'ᴹᴿ᭄𝙨𝙖𝙣𝙯𝙪 𝙬𝙤𝙧𝙠𝙚𝙧';
const BOT_NAME = 'WORKER-MD';
const MENU_IMAGE = 'https://files.catbox.moe/uykbkb.jpg';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const sessions = {};

// Serveur HTTP pour Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WORKER-MD actif');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`⚔️ Serveur HTTP actif sur port ${PORT}`);
});

const MENU_TEXT = `
╔══════════════════╗
║  ⚔️ ${BOT_NAME} ⚔️
╚══════════════════╝

╔════❰ ⚔️ ʙᴏᴛ ɪɴғᴏ ❱════╗
║ 👑 ᴄʀᴇᴀᴛᴏʀ: ${CREATOR}
║ 📦 ᴘʀᴇғɪx: .
║ ⚙️ ᴍᴏᴅᴇ: ᴘᴜʙʟɪᴄ
║ 🏷️ ᴠᴇʀsɪᴏɴ: 1.0.0
╚══════════════════╝

╔══❰ 👥 ɢʀᴏᴜᴘ ❱══╗
║ ─ ᴋɪᴄᴋᴀʟʟ
║ ─ ᴋɪᴄᴋ
║ ─ ᴘʀᴏᴍᴏᴛᴇ
║ ─ ᴅᴇᴍᴏᴛᴇ
║ ─ ᴍᴜᴛᴇ
║ ─ ᴜɴᴍᴜᴛᴇ
║ ─ ᴀᴅᴅ
║ ─ ᴛᴀɢᴀʟʟ
║ ─ ʟɪɴᴋ
║ ─ ʀᴇᴠᴏᴋᴇ
║ ─ ɢɪɴғᴏ
╚══════════════════╝

╔══❰ 🛠️ ᴛᴏᴏʟs ❱══╗
║ ─ ᴘɪɴɢ
║ ─ ᴀʟɪᴠᴇ
║ ─ ᴜᴘᴛɪᴍᴇ
║ ─ ᴍᴇɴᴜ
╚══════════════════╝

╔══❰ 🎮 ғᴜɴ ❱══╗
║ ─ ᴊᴏᴋᴇ
║ ─ ǫᴜᴏᴛᴇ
║ ─ ʀᴏᴀsᴛ
║ ─ ᴄᴏɪɴғʟɪᴘ
║ ─ 8ʙᴀʟʟ
╚══════════════════╝

╔══❰ 📥 ᴅᴏᴡɴʟᴏᴀᴅ ❱══╗
║ ─ ʏᴛᴠ
║ ─ sᴏɴɢ
║ ─ ᴛɪᴋᴛᴏᴋ
║ ─ ɪɴsᴛᴀɢʀᴀᴍ
╚══════════════════╝

> ⚔️ *© POWERED BY ${CREATOR}*
`;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, MENU_IMAGE, {
    caption: `
⚔️ *WORKER-MD* ⚔️

ʙɪᴇɴᴠᴇɴᴜ sᴜʀ ʟᴇ ʙᴏᴛ ᴅᴇ *${CREATOR}*

╔══════════════════╗
║ /pair — ᴄᴏɴɴᴇᴄᴛᴇʀ ᴡʜᴀᴛsᴀᴘᴘ
║ /menu — ᴠᴏɪʀ ʟᴇs ᴄᴏᴍᴍᴀɴᴅᴇs
║ /status — ᴠᴇʀɪғɪᴇʀ ᴄᴏɴɴᴇxɪᴏɴ
║ /delete — sᴜᴘᴘʀɪᴍᴇʀ sᴇssɪᴏɴ
╚══════════════════╝

⚔️ *The warrior awaits your command...*
    `,
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, MENU_IMAGE, {
    caption: MENU_TEXT,
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/pair/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `
📱 *ᴄᴏɴɴᴇᴄᴛ ᴡʜᴀᴛsᴀᴘᴘ*

ᴇɴᴠᴏɪᴇ ᴛᴏɴ ɴᴜᴍᴇʀᴏ ᴀᴠᴇᴄ ɪɴᴅɪᴄᴀᴛɪғ:
*Exemple:* 24104160140
  `, { parse_mode: 'Markdown' });

  bot.once('message', async (numMsg) => {
    if (numMsg.chat.id !== chatId) return;
    const phone = numMsg.text.replace(/[^0-9]/g, '');
    if (phone.length < 8) {
      return bot.sendMessage(chatId, '❌ Numéro invalide.');
    }

    await bot.sendMessage(chatId, '⏳ *Génération du code en cours...*', { parse_mode: 'Markdown' });

    try {
      const sessionPath = `./sessions/${chatId}`;
      if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['WORKER-MD', 'Chrome', '1.0.0'],
      });

      sessions[chatId] = sock;
      sock.ev.on('creds.update', saveCreds);

      await new Promise(r => setTimeout(r, 3000));

      const code = await sock.requestPairingCode(phone);
      const formatted = code.match(/.{1,4}/g).join('-');

      await bot.sendMessage(chatId, `
⚔️ *WORKER-MD PAIRING* ⚔️

📱 *Phone:* +${phone}
🔑 *Code:* \`${formatted}\`

1️⃣ Ouvre WhatsApp
2️⃣ Appareils liés → Associer un appareil
3️⃣ Lier avec numéro de téléphone
4️⃣ Entre le code ci-dessus

⚠️ *Entre le code rapidement*

> ⚔️ *© ${CREATOR}*
      `, { parse_mode: 'Markdown' });

      sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
          await bot.sendMessage(chatId, `
⚔️ *WhatsApp connecté avec succès!*

👑 *WORKER-MD est actif*
⚔️ *${CREATOR}*

> ᴛᴀᴘᴇ *.menu* sᴜʀ ᴡʜᴀᴛsᴀᴘᴘ
          `, { parse_mode: 'Markdown' });
        }
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            await bot.sendMessage(chatId, '🔄 *Reconnexion en cours...*', { parse_mode: 'Markdown' });
          } else {
            await bot.sendMessage(chatId, '❌ *Déconnecté. Utilise /pair pour reconnecter.*', { parse_mode: 'Markdown' });
          }
        }
      });

    } catch (err) {
      bot.sendMessage(chatId, `❌ *Erreur:* ${err.message}`, { parse_mode: 'Markdown' });
    }
  });
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const connected = sessions[chatId] ? '✅ Connecté' : '❌ Non connecté';
  bot.sendMessage(chatId, `
╔══════════════════╗
║ ⚔️ *WORKER-MD STATUS*
╠══════════════════╣
║ 📡 Statut: ${connected}
║ 👑 Owner: ${CREATOR}
╚══════════════════╝
  `, { parse_mode: 'Markdown' });
});

bot.onText(/\/delete/, async (msg) => {
  const chatId = msg.chat.id;
  const sessionPath = `./sessions/${chatId}`;
  if (sessions[chatId]) {
    try { await sessions[chatId].logout(); } catch (e) {}
    delete sessions[chatId];
  }
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true });
    bot.sendMessage(chatId, '🗑️ *Session supprimée.*', { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '⚠️ *Aucune session trouvée.*', { parse_mode: 'Markdown' });
  }
});

console.log(`⚔️ WORKER-MD Bot démarré par ${CREATOR}`);

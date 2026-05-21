const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_NUMBER = '24104160140';
const CREATOR = 'SanZu';
const BOT_NAME = 'WORKER-MD';
const MENU_IMAGE = 'https://files.catbox.moe/uykbkb.jpg';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const sessions = {};

const MENU_TEXT = `
╔══════════════════╗
║  ✦ ${BOT_NAME} ✦
╚══════════════════╝

╔════❰ 🖤 ʙᴏᴛ ɪɴғᴏ ❱════╗
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
║ ─ ʜɪᴅᴇᴛᴀɢ
║ ─ ᴛᴀɢᴀʟʟ
║ ─ ʟɪɴᴋ
║ ─ ʀᴇᴠᴏᴋᴇ
╚══════════════════╝

╔══❰ ⚙️ sᴇᴛᴛɪɴɢs ❱══╗
║ ─ ᴀɴᴛɪʟɪɴᴋ
║ ─ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ
║ ─ ᴡᴇʟᴄᴏᴍᴇ
║ ─ ᴀᴜᴛᴏʀᴇᴀᴄᴛ
║ ─ ᴏɴʟɪɴᴇ
╚══════════════════╝

╔══❰ 🎮 ғᴜɴ ❱══╗
║ ─ ᴊᴏᴋᴇ
║ ─ ǫᴜᴏᴛᴇ
║ ─ ʀᴏᴀsᴛ
║ ─ ᴄᴏɪɴғʟɪᴘ
║ ─ 8ʙᴀʟʟ
╚══════════════════╝

╔══❰ 🛠️ ᴛᴏᴏʟs ❱══╗
║ ─ ᴘɪɴɢ
║ ─ ᴜᴘᴛɪᴍᴇ
║ ─ ᴀʟɪᴠᴇ
║ ─ sᴛɪᴄᴋᴇʀ
║ ─ ᴡᴇᴀᴛʜᴇʀ
╚══════════════════╝

╔══❰ 📥 ᴅᴏᴡɴʟᴏᴀᴅ ❱══╗
║ ─ ʏᴛᴠ
║ ─ sᴏɴɢ
║ ─ ᴛɪᴋᴛᴏᴋ
║ ─ ɪɴsᴛᴀɢʀᴀᴍ
╚══════════════════╝

> 🖤 *© POWERED BY ${CREATOR}*
`;

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, MENU_IMAGE, {
    caption: `
🖤 *WORKER-MD* 🖤

ʙɪᴇɴᴠᴇɴᴜ sᴜʀ ʟᴇ ʙᴏᴛ ᴅᴇ *${CREATOR}*

╔══════════════════╗
║ /pair — ᴄᴏɴɴᴇᴄᴛᴇʀ ᴡʜᴀᴛsᴀᴘᴘ
║ /menu — ᴠᴏɪʀ ʟᴇs ᴄᴏᴍᴍᴀɴᴅᴇs
║ /status — ᴠᴇʀɪғɪᴇʀ ᴄᴏɴɴᴇxɪᴏɴ
║ /delete — sᴜᴘᴘʀɪᴍᴇʀ sᴇssɪᴏɴ
╚══════════════════╝

🖤 *The shadows await your command...*
    `,
    parse_mode: 'Markdown'
  });
});

// /menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendPhoto(chatId, MENU_IMAGE, {
    caption: MENU_TEXT,
    parse_mode: 'Markdown'
  });
});

// /pair
bot.onText(/\/pair/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
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

    bot.sendMessage(chatId, '⏳ *Génération du code...* Patiente 5 secondes.', { parse_mode: 'Markdown' });

    try {
      const sessionPath = `./sessions/${chatId}`;
      if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
      });

      sessions[chatId] = sock;

      const code = await sock.requestPairingCode(phone);
      const formatted = code.match(/.{1,4}/g).join('-');

      bot.sendMessage(chatId, `
🖤 *WORKER-MD PAIRING* 🖤

📱 *Phone:* +${phone}
🔑 *Code:* \`${formatted}\`

1️⃣ Ouvre WhatsApp
2️⃣ Appareils liés → Associer un appareil
3️⃣ Lier avec numéro de téléphone
4️⃣ Entre le code ci-dessus

⏳ *Expire dans 2 minutes*

> 🖤 *© ${CREATOR}*
      `, { parse_mode: 'Markdown' });

      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
          bot.sendMessage(chatId, `✅ *WhatsApp connecté avec succès!*\n\n🖤 *WORKER-MD est actif*`, { parse_mode: 'Markdown' });
        }
        if (connection === 'close') {
          bot.sendMessage(chatId, '❌ *Connexion fermée.*', { parse_mode: 'Markdown' });
        }
      });

    } catch (err) {
      bot.sendMessage(chatId, `❌ Erreur: ${err.message}`);
    }
  });
});

// /status
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const connected = sessions[chatId] ? '✅ Connecté' : '❌ Non connecté';
  bot.sendMessage(chatId, `
╔══════════════════╗
║ 🖤 *WORKER-MD STATUS*
╠══════════════════╣
║ 📡 Statut: ${connected}
║ 👑 Owner: ${CREATOR}
╚══════════════════╝
  `, { parse_mode: 'Markdown' });
});

// /delete
bot.onText(/\/delete/, (msg) => {
  const chatId = msg.chat.id;
  const sessionPath = `./sessions/${chatId}`;
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true });
    delete sessions[chatId];
    bot.sendMessage(chatId, '🗑️ *Session supprimée.*', { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, '⚠️ *Aucune session trouvée.*', { parse_mode: 'Markdown' });
  }
});

console.log(`🖤 WORKER-MD Bot démarré par ${CREATOR}`);

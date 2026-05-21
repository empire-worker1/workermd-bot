const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

const OWNER = '24104160140';
const CREATOR = 'SanZu';
const BOT_NAME = 'WORKER-MD';
const PREFIX = '.';
const startTime = Date.now();

function getUptime() {
  const diff = Date.now() - startTime;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

async function startWorker(sessionPath, sendToTelegram) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    const senderNum = sender.replace('@s.whatsapp.net', '');
    const isOwner = senderNum === OWNER;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption || '';

    if (!body.startsWith(PREFIX)) return;
    const cmd = body.slice(PREFIX.length).trim().split(' ')[0].toLowerCase();
    const args = body.slice(PREFIX.length + cmd.length).trim();

    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    // Infos groupe
    let groupMeta, participants, admins;
    if (isGroup) {
      groupMeta = await sock.groupMetadata(from);
      participants = groupMeta.participants;
      admins = participants.filter(p => p.admin).map(p => p.id);
      const isAdmin = admins.includes(sender);
      const isBotAdmin = admins.includes(sock.user.id);

      // ─── COMMANDES GROUPE ───

      if (cmd === 'kickall') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        await reply('🖤 *Kickall en cours...*');
        for (const p of participants) {
          if (p.id === sock.user.id) continue;
          if (admins.includes(p.id)) continue;
          await sock.groupParticipantsUpdate(from, [p.id], 'remove');
          await new Promise(r => setTimeout(r, 500));
        }
        return reply('✅ *Tous les membres ont été expulsés.*');
      }

      if (cmd === 'kick') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('↩️ *Réponds au message du membre à kicker.*');
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        return reply(`✅ *Membre expulsé.*`);
      }

      if (cmd === 'promote') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('↩️ *Réponds au message du membre à promouvoir.*');
        await sock.groupParticipantsUpdate(from, [target], 'promote');
        return reply(`✅ *Membre promu admin.*`);
      }

      if (cmd === 'demote') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('↩️ *Réponds au message du membre à rétrograder.*');
        await sock.groupParticipantsUpdate(from, [target], 'demote');
        return reply(`✅ *Membre rétrogradé.*`);
      }

      if (cmd === 'mute') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        await sock.groupSettingUpdate(from, 'announcement');
        return reply('🔇 *Groupe mis en silence. Seuls les admins peuvent écrire.*');
      }

      if (cmd === 'unmute') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        await sock.groupSettingUpdate(from, 'not_announcement');
        return reply('🔊 *Groupe réouvert à tous.*');
      }

      if (cmd === 'tagall' || cmd === 'hidetag') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        const mentions = participants.map(p => p.id);
        const text = args || `🖤 *${BOT_NAME} — Message pour tous*`;
        await sock.sendMessage(from, { text, mentions });
        return;
      }

      if (cmd === 'link') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        const inv = await sock.groupInviteCode(from);
        return reply(`🔗 *Lien du groupe:*\nhttps://chat.whatsapp.com/${inv}`);
      }

      if (cmd === 'revoke') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        await sock.groupRevokeInvite(from);
        return reply('✅ *Lien révoqué. Un nouveau lien a été généré.*');
      }

      if (cmd === 'add') {
        if (!isOwner && !isAdmin) return reply('❌ *Réservé aux admins.*');
        if (!isBotAdmin) return reply('❌ *Je dois être admin.*');
        const num = args.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.groupParticipantsUpdate(from, [num], 'add');
        return reply(`✅ *Membre ajouté.*`);
      }

      if (cmd === 'ginfo') {
        return reply(`
╔══════════════════╗
║ 🖤 *INFO GROUPE*
╠══════════════════╣
║ 📛 Nom: ${groupMeta.subject}
║ 👥 Membres: ${participants.length}
║ 👑 Admins: ${admins.length}
╚══════════════════╝
        `);
      }
    }

    // ─── COMMANDES GÉNÉRALES ───

    if (cmd === 'ping') {
      const start = Date.now();
      await reply('🏓 *Pong!*');
      const latency = Date.now() - start;
      return reply(`⚡ *Latence: ${latency}ms*`);
    }

    if (cmd === 'alive') {
      return reply(`
╔══════════════════╗
║ 🖤 *${BOT_NAME}*
╠══════════════════╣
║ ✅ ᴊᴇ sᴜɪs ᴠɪᴠᴀɴᴛ
║ 👑 ᴄʀᴇᴀᴛᴏʀ: ${CREATOR}
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${getUptime()}
╚══════════════════╝
🖤 *The shadows await...*
      `);
    }

    if (cmd === 'uptime') {
      return reply(`⏱️ *Uptime:* ${getUptime()}`);
    }

    if (cmd === 'menu') {
      return reply(`
╔══════════════════╗
║ 🖤 *${BOT_NAME}*
╚══════════════════╝

╔════❰ 🖤 ʙᴏᴛ ɪɴғᴏ ❱════╗
║ 👑 ᴄʀᴇᴀᴛᴏʀ: ${CREATOR}
║ 📦 ᴘʀᴇғɪx: ${PREFIX}
║ ⏱️ ᴜᴘᴛɪᴍᴇ: ${getUptime()}
╚══════════════════╝

╔══❰ 👥 ɢʀᴏᴜᴘ ❱══╗
║ ─ ᴋɪᴄᴋᴀʟʟ
║ ─ ᴋɪᴄᴋ
║ ─ ᴘʀᴏᴍᴏᴛᴇ
║ ─ ᴅᴇᴍᴏᴛᴇ
║ ─ ᴍᴜᴛᴇ / ᴜɴᴍᴜᴛᴇ
║ ─ ᴀᴅᴅ
║ ─ ᴛᴀɢᴀʟʟ
║ ─ ʟɪɴᴋ / ʀᴇᴠᴏᴋᴇ
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

> 🖤 *© POWERED BY ${CREATOR}*
      `);
    }

    if (cmd === 'joke') {
      const jokes = [
        "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau ! 😂",
        "Un homme entre dans une bibliothèque et demande un hamburger. Le bibliothécaire dit : Chut, vous êtes dans une bibliothèque ! L'homme chuchote : Désolé... un hamburger s'il vous plaît. 😂",
        "Qu'est-ce qu'un canif ? Un petit fien ! 😂"
      ];
      return reply(jokes[Math.floor(Math.random() * jokes.length)]);
    }

    if (cmd === 'quote') {
      const quotes = [
        "🖤 *Les ombres ne mentent jamais.*",
        "🖤 *Le silence est la réponse des forts.*",
        "🖤 *Ceux qui doutent de toi alimentent ta force.*"
      ];
      return reply(quotes[Math.floor(Math.random() * quotes.length)]);
    }

    if (cmd === 'roast') {
      const roasts = [
        "Tu es la preuve vivante que l'évolution peut faire marche arrière. 😂",
        "Si l'intelligence était de l'eau, tu serais le Sahara. 😂",
        "Tu n'es pas bête, tu simules juste parfaitement. 😂"
      ];
      return reply(roasts[Math.floor(Math.random() * roasts.length)]);
    }

    if (cmd === 'coinflip') {
      return reply(`🪙 *${Math.random() > 0.5 ? 'FACE' : 'PILE'}!*`);
    }

    if (cmd === '8ball') {
      const answers = [
        "✅ *Oui, absolument.*",
        "❌ *Non, certainement pas.*",
        "🤔 *Peut-être...*",
        "🖤 *Les ombres disent oui.*",
        "⚠️ *Ne compte pas dessus.*"
      ];
      return reply(answers[Math.floor(Math.random() * answers.length)]);
    }

  });

  return sock;
}

module.exports = { startWorker };

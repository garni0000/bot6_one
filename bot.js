
// =======================================
// IMPORTS ET INITIALISATIONS
// =======================================
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// Import dotenv and configure
require('dotenv').config();

// Load token from environment variables
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Admin IDs from environment variables
const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id)) : [];

// =======================================
// CONNEXION A MONGODB
// =======================================
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connecté à MongoDB."))
.catch(err => console.error("Erreur de connexion à MongoDB:", err));

// =======================================
// MODELE UTILISATEUR
// =======================================
const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  language: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('Userwin', userSchema);

// =======================================
// VARIABLES GLOBALES
// =======================================
let userLangs = {}; // Stockage temporaire des langues choisies

const messages = {
  welcome: {
    francais: "Bienvenue dans notre programme de prédiction des jeux 1win ! 🎯\n \n 🔹 𝟏è𝐫𝐞 é𝐭𝐚𝐩𝐞 :: Cliquez sur \"Sign up\" pour créer un compte 1win compatible avec nos signaux. 𝐔𝐭𝐢𝐥𝐢𝐬𝐞𝐳 𝐨𝐛𝐥𝐢𝐠𝐚𝐭𝐨𝐢𝐫𝐞𝐦𝐞𝐧𝐭 𝐥𝐞 𝐜𝐨𝐝𝐞 𝐩𝐫𝐨𝐦𝐨 𝐙𝐟𝐫𝐞𝐞𝟐𝟐𝟏 lors de l'inscription.\n \n🔹 𝟐è𝐦𝐞 é𝐭𝐚𝐩𝐞 : Une fois votre compte créé, cliquez sur \"Next\" pour continuer",
    
    english: "Welcome to our 1win game prediction program! 🎯\n \n 🔹 Step 1: Click \"Sign up\" to create a 1win account that works with our signals. You MUST use the promo code Zfree221 when signing up.\n \n🔹 Step 2: Once your account is created, click \"Next\" to continue.",

    
    russe: "**✨ 𝗗𝗼𝗯𝗿𝗼 𝗽𝗼𝘇𝗵𝗮𝗹𝗼𝘃𝗮𝘁𝗸𝗼 𝘃 𝗻𝗮𝘀𝗵𝘂 𝗽𝗿𝗼𝗴𝗿𝗮𝗺𝗺𝘂 𝗽𝗿𝗼𝗴𝗻𝗼𝘇𝗶𝗿𝗼𝘃𝗮𝗻𝗶𝗷 𝗶𝗴𝗿 𝟭𝘄𝗶𝗻! 🎯**  \n \n🔹 **𝟭-𝘆𝗶̆ 𝗦𝗵𝗮𝗴** :: Нажмите **「sign up」** для создания аккаунта **𝟭𝘄𝗶𝗻**, совместимого с нашими сигналами. **🚨 𝗢𝗕𝗬𝗔𝗭𝗔𝗧𝗘𝗟𝗡𝗢 𝗩𝗩𝗘𝗗𝗜𝗧𝗘 𝗣𝗥𝗢𝗠𝗢𝗞𝗢𝗗 「𝗭𝗳𝗿𝗲𝗲𝟮𝟮𝟭」** при регистрации.  \n \n🔹 **𝟮-𝘆𝗶̆ 𝗦𝗵𝗮𝗴** :: После создания аккаунта нажмите **「𝗡𝗲𝘅𝘁」** для продолжения."
  },
  enterID: {
    francais: "Veuillez entrer votre ID 1win...",
    english: "Please enter your 1win ID...",
    russe: "Пожалуйста, введите ваш ID 1win..."
  },
  invalidID: {
    francais: {
      text: "Votre ID est refusé. Vous devez créer un nouveau compte avec le code promo Zfree221.",
      inline_keyboard: [
        [{ text: "Sign up", url: "https://1wmnt.com/?open=register#j7rc" }],
        [{ text: "Next ➡️", callback_data: "suivant" }]
      ]
    },
    english: {
      text: "Your ID has been refused. You need to create a new professional account.",
      inline_keyboard: [
        [{ text: "Sign up", url: "https://1wmnt.com/?open=register#j7rc" }],
        [{ text: "Next ➡️", callback_data: "suivant" }]
      ]
    },
    russe: {
      text: "Ваш ID отклонён. Вам необходимо создать новую учетную запись.",
      inline_keyboard: [
        [{ text: "Sign up", url: "https://1wmnt.com/?open=register#j7rc" }],
        [{ text: "Next ➡️", callback_data: "suivant" }]
      ]
    }
  }
};

// =======================================
// COMMANDE /start : CHOIX DE LANGUE
// =======================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  saveUser(msg);

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Francais', callback_data: 'francais' }],
        [{ text: 'English', callback_data: 'english' }],
        [{ text: 'Русский', callback_data: 'russe' }]
      ]
    }
  };
  bot.sendMessage(chatId, 'Veuillez choisir votre langue', opts);
});

// =======================================
// GESTION DES CALLBACKS (CHOIX DE LANGUE & NEXT)
// =======================================
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data in messages.welcome) {
    userLangs[chatId] = data;
    await User.findOneAndUpdate({ telegramId: chatId }, { language: data });

    bot.sendMessage(chatId, messages.welcome[data], {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Sign up', url: 'https://1wmnt.com/?open=register#j7rc' }],
          [{ text: 'Next ➡️', callback_data: 'suivant' }]
        ]
      }
    });
  } else if (data === 'suivant') {
    const lang = userLangs[chatId] || 'english';
    bot.sendMessage(chatId, messages.enterID[lang], { parse_mode: 'Markdown', reply_markup: { force_reply: true } });
  }
});

// =======================================
// GESTION DES MESSAGES (ENTRÉE D'ID)
// =======================================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text) return;

  if (msg.reply_to_message && msg.reply_to_message.text && msg.reply_to_message.text.includes('ID')) {
    const id = parseInt(msg.text.trim());
    const lang = userLangs[chatId] || 'english';

    if (!isNaN(id) && id >= 307315251 && id <= 399999999) {
      bot.sendMessage(chatId, 'ID accepté, veuillez choisir votre hack', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Mine', url: 'http://t.me/FREE441BOT/Minebot' }],
            [{ text: 'Lucky Jet', url: 'http://t.me/FREE441BOT/Luckyjet' }],
            [{ text: 'Bombucks', url: 'http://t.me/FREE441BOT/bombe' }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, messages.invalidID[lang].text, {
        reply_markup: { inline_keyboard: messages.invalidID[lang].inline_keyboard }
      });
    }
  }
});

// =======================================
// COMMANDE /stats (ADMIN)
// =======================================
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  if (!adminIds.includes(msg.from.id)) return bot.sendMessage(chatId, "Accès refusé.");

  const totalUsers = await User.countDocuments();
  const languages = await User.aggregate([{ $group: { _id: "$language", count: { $sum: 1 } } }]);

  let statsMsg = `📊 Stats:\nTotal utilisateurs: ${totalUsers}\n\nLangues:\n`;
  languages.forEach(l => { statsMsg += `${l._id || 'Non défini'} : ${l.count}\n`; });

  bot.sendMessage(chatId, statsMsg);
});

// =======================================
// SERVEUR HTTP (KEEP-ALIVE)
// =======================================
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("I'm alive");
  res.end();
});
server.listen(8080, () => console.log("Serveur keep-alive actif sur le port 8080"));

// =======================================
// ENREGISTREMENT UTILISATEUR
// =======================================
async function saveUser(msg) {
  const userData = { telegramId: msg.from.id, firstName: msg.from.first_name, lastName: msg.from.last_name, username: msg.from.username };
  let user = await User.findOne({ telegramId: msg.from.id });
  if (!user) await new User(userData).save();
}







// =======================================
// COMMANDE /send : DIFFUSION AUX ABONNÉS
// =======================================
bot.onText(/\/send/, async (msg) => {
    const chatId = msg.chat.id;

    // Vérifie si l'utilisateur est un admin
    if (!adminIds.includes(msg.from.id)) {
        return bot.sendMessage(chatId, "🚫 Vous n'êtes pas autorisé à utiliser cette commande.");
    }

    // Vérifie si l'admin répond à un message
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, "⚠️ Répondez à un message avec /send pour le diffuser.");
    }

    const message = msg.reply_to_message;
    const users = await User.find();
    let success = 0, errors = 0;

    await bot.sendMessage(chatId, `📤 Début de la diffusion à ${users.length} utilisateurs...`);

    for (const user of users) {
        try {
            await sendContent(user.telegramId, message);
            success++;
        } catch (error) {
            console.error(`❌ Erreur pour ${user.telegramId}:`, error);

            if (error.response && error.response.statusCode === 403) {
                // Si l'utilisateur a bloqué le bot, on le supprime de la base
                await User.deleteOne({ telegramId: user.telegramId });
            }
            errors++;
        }
    }

    await bot.sendMessage(chatId, `✅ Diffusion terminée :\n📨 Envoyés avec succès: ${success}\n❌ Échecs: ${errors}`);
});

// =======================================
// FONCTION D'ENVOI AUTOMATIQUE DU MESSAGE
// =======================================
async function sendContent(chatId, message) {
    if (message.text) {
        return bot.sendMessage(chatId, message.text, { parse_mode: 'Markdown' });
    }
    if (message.photo) {
        const photoId = message.photo[message.photo.length - 1].file_id;
        return bot.sendPhoto(chatId, photoId, { caption: message.caption || "" });
    }
    if (message.video) {
        return bot.sendVideo(chatId, message.video.file_id, { caption: message.caption || "" });
    }
}

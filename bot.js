// =======================================
// IMPORTS ET INITIALISATIONS
// =======================================
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// Remplace ce token par ton token de bot
const token = '7743934602:AAF9dkZW7QvNff6Sw0MChCMNC0XgevixYWE';
const bot = new TelegramBot(token, { polling: true });


// Identifiants admin (remplace par tes IDs Telegram)
const adminIds = [1613186921]; // Exemple : [123456789, 987654321]

// =======================================
// CONNEXION A MONGODB
// =======================================
mongoose.connect('mongodb+srv://josh:JcipLjQSbhxbruLU@cluster0.hn4lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
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
const User = mongoose.model('User', userSchema);

// =======================================
// VARIABLES GLOBALES
// =======================================
let userLangs = {}; // Stockage temporaire des langues choisies

const messages = {
  welcome: {
    francais: "Bienvenue au programme de prédiction des jeux 1win...",
    english: "Welcome to the 1win games prediction program...",
    russe: "Добро пожаловать в программу прогнозирования игр 1win..."
  },
  enterID: {
    francais: "Veuillez entrer votre ID 1win...",
    english: "Please enter your 1win ID...",
    russe: "Пожалуйста, введите ваш ID 1win..."
  },
  invalidID: {
    francais: {
      text: "Votre ID est refusé. Vous devez créer un nouveau compte avec le code promo Zfree221 [en cliquant ici](https://1wmnt.com/?open=register#j7rc).",
      inline_keyboard: [
        [{ text: "Sign up", url: "https://1wmnt.com/?open=register#j7rc" }],
        [{ text: "Next ➡️", callback_data: "suivant" }]
      ]
    },
    english: {
      text: "Your ID has been refused. You need to create a new professional account [by clicking here](https://1wmnt.com/?open=register#j7rc).",
      inline_keyboard: [
        [{ text: "Sign up", url: "https://1wmnt.com/?open=register#j7rc" }],
        [{ text: "Next ➡️", callback_data: "suivant" }]
      ]
    },
    russe: {
      text: "Ваш ID отклонён. Вам необходимо создать новую учетную запись [нажав здесь](https://1wmnt.com/?open=register#j7rc).",
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
  
  if (msg.reply_to_message && msg.reply_to_message.text.includes('ID')) {
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
        parse_mode: 'Markdown',
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

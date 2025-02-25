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
.then(() => console.log("Connecté à MongoDB (hackwin_cluster_crack)."))
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
let userLangs = {}; // Stockage temporaire de la langue choisie pour chaque utilisateur

const messages = {
  welcome: {
    francais: "Bienvenue au programme de prédiction des jeux 1win. Pour commencer, veuillez cliquer sur le bouton Sign up pour créer un compte compatible avec nos signaux. Après cela, cliquez sur Next pour continuer.",
    english: "Welcome to the 1win games prediction program. To get started, please click the Sign up button to create an account compatible with our signals. After that, click Next to continue.",
    russe: "Добро пожаловать в программу прогнозирования игр 1win. Для начала, пожалуйста, нажмите кнопку Зарегистрироваться, чтобы создать аккаунт, совместимый с нашими сигналами. После этого нажмите Next, чтобы продолжить."
  },
  enterID: {
    francais: "Veuillez entrer votre ID 1win pour le connecter au programme.",
    english: "Please enter your 1win ID to connect it to the program.",
    russe: "Пожалуйста, введите ваш ID 1win для подключения к программе."
  },
  invalidID: {
    francais: "Votre ID est refusé. Vous devez créer un nouveau compte professionnel [en cliquant ici](https://1wmnt.com/?open=register#j7rc).\nBesoin d'aide ? contactez admis 👉 @medatt00",
    english: "Your ID is refused. You need to create a new professional account [by clicking here](https://1wmnt.com/?open=register#j7rc).\nNeed help? contact admitted 👉 @medatt00.",
    russe: "Ваш ID отклонён. Вам необходимо создать новую профессиональную учетную запись [нажав здесь](https://1wmnt.com/?open=register#j7rc).\nНужна помощь? обращайтесь к 👉 @medatt00"
  }
};

// =======================================
// FONCTION D'ENREGISTREMENT DE L'UTILISATEUR
// =======================================
async function saveUser(msg) {
  const userData = {
    telegramId: msg.from.id,
    firstName: msg.from.first_name,
    lastName: msg.from.last_name,
    username: msg.from.username
  };

  try {
    let user = await User.findOne({ telegramId: msg.from.id });
    if (!user) {
      user = new User(userData);
      await user.save();
      console.log(`Utilisateur ${msg.from.id} enregistré dans MongoDB.`);
    } else {
      console.log(`Utilisateur ${msg.from.id} existe déjà dans MongoDB.`);
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement dans MongoDB :", error);
  }
}

// =======================================
// COMMANDE /start : CHOIX DE LANGUE
// =======================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // Enregistrement de l'utilisateur dans la DB
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
// GESTION DES CALLBACKS (CHOIX DE LANGUE & SUIVANT)
// =======================================
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === 'francais' || data === 'english' || data === 'russe') {
    userLangs[chatId] = data; // Stockage de la langue choisie

    // Mise à jour dans MongoDB
    try {
      await User.findOneAndUpdate({ telegramId: chatId }, { language: data });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la langue dans MongoDB :", error);
    }

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
    bot.sendMessage(chatId, messages.enterID[lang], {
      parse_mode: 'Markdown',
      reply_markup: { force_reply: true }
    });
  }
});

// =======================================
// GESTION DES MESSAGES DE REPONSE (ENTRÉE D'ID)
// =======================================
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text) return;
  const text = msg.text.trim();

  // Vérifie si le message est une réponse à la demande d'ID
  if (msg.reply_to_message && msg.reply_to_message.text && msg.reply_to_message.text.includes('ID')) {
    const id = parseInt(text);
    const lang = userLangs[chatId] || 'english';

    if (!isNaN(id) && id >= 307315251 && id <= 399999999) {
      // ID valide
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
      // ID invalide
      bot.sendMessage(chatId, messages.invalidID[lang], { parse_mode: 'Markdown' });
    }
  }
});

// =======================================
// COMMANDE /stats (ADMIN) : STATISTIQUES UTILISATEURS
// =======================================
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  if (!adminIds.includes(msg.from.id)) {
    return bot.sendMessage(chatId, "Vous n'êtes pas autorisé à utiliser cette commande.");
  }

  try {
    const totalUsers = await User.countDocuments();
    const languages = await User.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } }
    ]);
    let statsMsg = `📊 Statistiques :\nTotal utilisateurs : ${totalUsers}\n\nUtilisateurs par langue :\n`;
    languages.forEach(langStat => {
      statsMsg += `${langStat._id || 'Non défini'} : ${langStat.count}\n`;
    });
    bot.sendMessage(chatId, statsMsg);
  } catch (error) {
    console.error("Erreur lors de la récupération des stats :", error);
    bot.sendMessage(chatId, "Erreur lors de la récupération des statistiques.");
  }
});

// =======================================
// SERVEUR HTTP (KEEP-ALIVE)
// =======================================
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("I'm alive");
  res.end();
});
server.listen(8080, () => {
  console.log("Serveur keep-alive en fonctionnement sur le port 8080");
});

// =======================================
// FONCTION UTILE POUR L'ENVOI DU CONTENU
// =======================================
async function sendContent(chatId, message) {
  // On affiche en console le message pour débugger (optionnel)
  // console.log("Message à renvoyer :", message);

  // Texte (possibilité de légende)
  if (message.text) {
    return bot.sendMessage(chatId, message.text, { parse_mode: 'Markdown' });
  }
  // Photo (le message.photo est un tableau avec plusieurs résolutions)
  if (message.photo) {
    const photoId = message.photo[message.photo.length - 1].file_id;
    return bot.sendPhoto(chatId, photoId, { caption: message.caption || "" });
  }
  // Vidéo
  if (message.video) {
    return bot.sendVideo(chatId, message.video.file_id, { caption: message.caption || "" });
  }
  // Document
  if (message.document) {
    return bot.sendDocument(chatId, message.document.file_id, { caption: message.caption || "" });
  }
  // Audio
  if (message.audio) {
    return bot.sendAudio(chatId, message.audio.file_id, { caption: message.caption || "" });
  }
  // Message vocal
  if (message.voice) {
    return bot.sendVoice(chatId, message.voice.file_id);
  }
  // Sticker
  if (message.sticker) {
    return bot.sendSticker(chatId, message.sticker.file_id);
  }
  // Vidéo note
  if (message.video_note) {
    return bot.sendVideoNote(chatId, message.video_note.file_id);
  }
  // En dernier recours, transfert du message original
  return bot.forwardMessage(chatId, message.chat.id, message.message_id);
}

// =======================================
// COMMANDE /send (ADMIN) : DIFFUSION DU MESSAGE
// =======================================
bot.onText(/\/send/, async (msg) => {
  if (!adminIds.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, "Vous n'êtes pas autorisé à utiliser cette commande.");
  }
  if (!msg.reply_to_message) {
    return bot.sendMessage(msg.chat.id, '⚠️ Veuillez répondre à un message avec /send pour le diffuser');
  }

  const message = msg.reply_to_message;
  const users = await User.find();
  let success = 0, errors = 0;

  await bot.sendMessage(msg.chat.id, `📤 Début de la diffusion à ${users.length} utilisateurs...`);

  for (const user of users) {
    try {
      await sendContent(user.telegramId, message);
      success++;
    } catch (error) {
      console.error(`Erreur pour ${user.telegramId}:`, error);
      if (error.code === 403) {
        // Suppression de l'utilisateur si le bot n'est plus autorisé à envoyer des messages
        await User.deleteOne({ telegramId: user.telegramId });
      }
      errors++;
    }
  }

  await bot.sendMessage(msg.chat.id, `✅ Diffusion terminée :\n📨 Envoyés avec succès: ${success}\n❌ Échecs: ${errors}`);
});

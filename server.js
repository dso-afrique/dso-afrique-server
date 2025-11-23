require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Brevo = require('@getbrevo/brevo');
const Contact = require('./models/Contact');

const app = express();

// 🧩 Middleware
app.use(cors({
  origin: 'https://www.dso-afrique.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// 🔗 Connexion MongoDB
const uri = 'mongodb+srv://ayoubzekhnine96:CwTQ21a8wUgoTLSp@clustersawti.wqsgj.mongodb.net/dsoafrique';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// 📩 Configuration API Brevo (nouvelle version 2024)
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// ✉️ Fonction d’envoi d’email via API Brevo
async function sendEmail(to, subject, htmlContent) {
  const emailData = {
    to: [{ email: to }],
    sender: { name: 'DSO-Afrique', email: 'theafricancode1@gmail.com' },
    subject,
    htmlContent,
  };

  try {
    const response = await apiInstance.sendTransacEmail(emailData);
    console.log(`✅ Email envoyé à ${to} (Message ID: ${response.messageId || 'non fourni'})`);
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.response?.text || error.message);
  }
}

// 🚀 Route POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phoneNumber, profession, message } = req.body;

    // Vérification basique
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    // 1️⃣ Sauvegarde dans MongoDB
    const newContact = new Contact({ name, email, phoneNumber, profession, message });
    await newContact.save();

    // 2️⃣ Email au prospect
    const htmlProspect = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bonjour ${name},</h2>
        <p>Merci d’avoir contacté <strong>DSO-Afrique</strong> 👋</p>
        <p>Nous avons bien reçu votre message.
        <p>Notre équipe vous contactera sous peu pour discuter de votre projet.</p>
        <br/>
        <p>À très bientôt,</p>
        <p><strong>L’équipe DSO-Afrique</strong></p>
        <hr/>
        <small>Ce message est automatique, merci de ne pas y répondre.</small>
      </div>
    `;

    // 3️⃣ Email à l’administrateur
    const htmlAdmin = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h3>📩 Nouveau message reçu depuis le site DSO-Afrique</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phoneNumber || 'Non renseigné'}</p>
        <p><strong>Profession :</strong> ${profession}</p>
        <p><strong>Message :</strong><br>${message}</p>
      </div>
    `;

    // 4️⃣ Envoi des deux emails
    await Promise.all([
      sendEmail(email, 'Merci pour votre message - DSO-Afrique', htmlProspect),
      sendEmail('ayoubzekhnine96@gmail.com', `📩 Nouveau message de ${name}`, htmlAdmin)
    ]);

    console.log('✅ Emails envoyés avec succès !');
    res.status(201).json({ message: 'Message envoyé avec succès 🚀' });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l’envoi du message.' });
  }
});

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Contact = require('./models/Contact');
require('dotenv').config();

const app = express();

// 🧩 Middlewares
app.use(cors({
  origin: 'https://www.dso-afrique.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// 🔗 Connexion MongoDB
const uri = 'mongodb+srv://ayoubzekhnine96:CwTQ21a8wUgoTLSp@clustersawti.wqsgj.mongodb.net/dsoafrique?retryWrites=true&w=majority&appName=ClusterSawti';

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// 📩 Configurer Nodemailer avec Brevo (Sendinblue)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true si port 465
  auth: {
    user: 'theafricancode1@gmail.com', // ton email Brevo
    pass: process.env.BREVO_API_KEY, // ta clé API Brevo
  },
});

// Vérification de la connexion SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
  } else {
    console.log('✅ Connexion SMTP réussie avec Brevo !');
  }
});

// 🚀 Route POST pour sauvegarder et envoyer un email
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;

    // 1️⃣ Sauvegarde dans MongoDB
    const newContact = new Contact({ name, email, projectType, message });
    await newContact.save();

    // 2️⃣ Préparation des emails
    const mailToProspect = {
      from: 'theafricancode1@gmail.com',
      to: email,
      subject: 'Merci pour votre message - DSO-Afrique',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Bonjour ${name},</h2>
          <p>Merci d’avoir contacté <strong>DSO-Afrique</strong> 👋</p>
          <p>Nous avons bien reçu votre message concernant : <b>${projectType}</b>.</p>
          <p>Notre équipe vous contactera sous peu pour discuter de votre projet.</p>
          <br/>
          <p>À très bientôt,</p>
          <p><strong>L’équipe DSO-Afrique</strong></p>
          <hr/>
          <small>Ce message est automatique, merci de ne pas y répondre.</small>
        </div>
      `,
    };

    const mailToAdmin = {
      from: 'theafricancode1@gmail.com',
      to: 'ayoubzekhnine96@gmail.com',
      subject: `📩 Nouveau message de ${name}`,
      text: `
        Nom : ${name}
        Email : ${email}
        Type de projet : ${projectType}
        Message : ${message}
      `,
    };

    // 3️⃣ Envoi des deux emails
    await Promise.all([
      transporter.sendMail(mailToAdmin),
      transporter.sendMail(mailToProspect),
    ]);

    console.log('✅ Emails envoyés avec succès !');

    // 4️⃣ Réponse au front
    res.status(201).json({ message: 'Message envoyé avec succès 🚀' });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l’envoi du message.' });
  }
});

// 🌐 Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

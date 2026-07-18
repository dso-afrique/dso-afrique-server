require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Brevo = require('@getbrevo/brevo');
const Contact = require('./models/Contact');

const app = express();

app.use(cors({
  origin: ['https://www.vexolead.com', 'https://vexolead.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

async function sendEmail(to, subject, htmlContent) {
  const emailData = {
    to: [{ email: to }],
    sender: { name: 'VexoLead', email: 'contact@vexolead.com' },
    subject,
    htmlContent,
  };

  try {
    const response = await apiInstance.sendTransacEmail(emailData);
    console.log(`✅ Email envoyé à ${to}`, response);
    return response;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.response?.text || error.message);
    throw error;
  }
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phoneNumber, profession, message } = req.body;

    if (!name || !email || !phoneNumber || !profession) {
      return res.status(400).json({
        message: 'Veuillez remplir tous les champs obligatoires.'
      });
    }

    const newContact = new Contact({ name, email, phoneNumber, profession, message });
    await newContact.save();

    const htmlProspect = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Bonjour ${name},</h2>
        <p>Merci d’avoir contacté <strong>VexoLead</strong> 👋</p>
        <p>Nous avons bien reçu votre demande.</p>
        <p>Notre équipe vous contactera sous peu pour discuter de votre projet.</p>
        <br/>
        <p>À très bientôt,</p>
        <p><strong>L’équipe VexoLead</strong></p>
        <hr/>
        <small>Ce message est automatique, merci de ne pas y répondre.</small>
      </div>
    `;

    const htmlAdmin = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h3>📩 Nouveau message reçu depuis le site VexoLead</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${phoneNumber || 'Non renseigné'}</p>
        <p><strong>Profession :</strong> ${profession}</p>
        <p><strong>Message :</strong><br>${message || 'Aucun message'}</p>
      </div>
    `;

    await Promise.all([
      sendEmail(email, 'Merci pour votre demande - VexoLead', htmlProspect),
      sendEmail('ayoubzekhnine96@gmail.com', `📩 Nouveau message de ${name}`, htmlAdmin)
    ]);

    res.status(201).json({ message: 'Message envoyé avec succès 🚀' });
  } catch (error) {
    console.error('❌ Erreur serveur:', error.response?.text || error.message || error);
    res.status(500).json({
      message: 'Erreur serveur lors de l’envoi du message.'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
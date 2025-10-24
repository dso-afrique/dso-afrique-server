const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Contact = require('./models/Contact');

const app = express();

// Middlewares
app.use(cors({
  origin: 'https://dso-afrique-yw9a.onrender.com', // ton front Render
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

const uri = 'mongodb+srv://ayoubzekhnine96:CwTQ21a8wUgoTLSp@clustersawti.wqsgj.mongodb.net/dsoafrique?retryWrites=true&w=majority&appName=ClusterSawti'

// Connexion MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// Route POST pour sauvegarder le message
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, projectType, message } = req.body;

    const newContact = new Contact({ name, email, projectType, message });
    await newContact.save();

    res.status(201).json({ message: 'Message envoyé avec succès 🚀' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

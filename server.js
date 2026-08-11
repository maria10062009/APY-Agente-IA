require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes'); // Caminho correto para a pasta routes

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 MongoDB Conectado!'))
    .catch(err => console.error('❌ Erro Banco:', err));

app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor: http://localhost:${PORT}`));
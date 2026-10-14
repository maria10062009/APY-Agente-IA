require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const documentRoutes = require('./documentRoutes');

app.use(express.json());

// Força o uso da pasta 'Public' e define index.html como o padrão
app.use(express.static(path.join(__dirname, 'Public'), { 
    index: 'index.html',
    extensions: ['html'] 
}));

app.use('/api', documentRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
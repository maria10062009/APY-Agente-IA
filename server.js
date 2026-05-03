// 1. Importações (Bibliotecas)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// 2. Configurações de Leitura e Segurança (TEM QUE VIR ANTES DAS ROTAS)
app.use(cors()); 
app.use(express.json()); 
app.use(express.static(__dirname)); // Permite carregar CSS, Imagens, etc.

// 3. Conexão com o Banco de Dados
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('📦 Conectado ao MongoDB Atlas!'))
  .catch((err) => console.error('❌ Erro no banco:', err));

// Definição do Banco
const MensagemSchema = new mongoose.Schema({
    role: String,
    parts: [{ text: String }],
    dataHora: { type: Date, default: Date.now }
});
const Mensagem = mongoose.model('Mensagem', MensagemSchema);

// 4. Configuração da IA (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 5. ROTAS (O que o servidor faz)

// Rota para abrir o site assim que entrar no endereço
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para processar o chat
app.post('/api/chat', async (req, res) => {
    try {
        const { pergunta } = req.body;
        
        if (!pergunta) {
            return res.status(400).json({ sucesso: false, erro: "Envie uma pergunta." });
        }

        // Salva a pergunta do usuário
        await Mensagem.create({ role: "user", parts: [{ text: pergunta }] });

        // Busca histórico
        const historico = await Mensagem.find()
                                        .select('role parts -_id') 
                                        .sort({ dataHora: 1 })
                                        .limit(20);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({ history: historico });

        const result = await chat.sendMessage(pergunta);
        const respostaDaIA = result.response.text();

        // Salva a resposta da IA
        await Mensagem.create({ role: "model", parts: [{ text: respostaDaIA }] });

        // Devolve para o site (O segredo está em mandar o objeto certinho aqui)
        return res.status(200).json({ sucesso: true, resposta: respostaDaIA });

    } catch (erro) {
        console.error("❌ Erro no Servidor:", erro);
        return res.status(500).json({ sucesso: false, erro: "Erro ao falar com a IA." });
    }
});

// 6. Ligar o Servidor
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
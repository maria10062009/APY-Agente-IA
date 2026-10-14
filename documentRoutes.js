const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authenticateToken = require('./auth');

// --- A solução para o erro DOMMatrix ---
// Se o pdf-parse tentar usar DOMMatrix e não achar, ele apenas ignora
global.DOMMatrix = class DOMMatrix {}; 
const pdfParse = require('pdf-parse'); 
// ---------------------------------------

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat/documento', authenticateToken, upload.single('documento'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Arquivo PDF necessário" });

        // Extração simples com pdf-parse
        const data = await pdfParse(req.file.buffer);
        const textoExtraido = data.text;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
        Você é um analista corporativo. Responda APENAS com base no CONTEÚDO DO DOCUMENTO fornecido.
        Se a informação não estiver no documento, responda: "Desculpe, não encontrei essa informação no documento."
        
        DOCUMENTO:
        ${textoExtraido}
        
        PERGUNTA: ${req.body.pergunta}
        `;

        const result = await model.generateContent(prompt);
        res.json({ resposta: result.response.text() });

    } catch (error) {
        console.error("Erro no processamento:", error);
        res.status(500).json({ error: "Erro ao processar PDF." });
    }
});

module.exports = router;
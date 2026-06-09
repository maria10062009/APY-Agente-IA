
exports.enviarMensagem = async (req, res) => {
    console.log("----------------------------");
    console.log("RECEBI UMA PERGUNTA:", req.body.pergunta); // ADICIONE ESTA LINHA
    console.log("----------------------------");
}
const Mensagem = require('../models/Mensagem');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.enviarMensagem = async (req, res) => {
    try {
        const { pergunta } = req.body;
        if (!pergunta) return res.status(400).json({ sucesso: false, erro: "Envie uma pergunta." });

        // 1. Salva pergunta do usuário
        await Mensagem.create({ role: "user", parts: [{ text: pergunta }] });

        // 2. Busca histórico para o Gemini ter contexto
        const historico = await Mensagem.find()
                                        .select('role parts -_id')
                                        .sort({ dataHora: 1 })
                                        .limit(20);

        // 3. Configura e chama o Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({ history: historico });
        const result = await chat.sendMessage(pergunta);
        const respostaDaIA = result.response.text();

        // 4. Salva resposta da IA
        await Mensagem.create({ role: "model", parts: [{ text: respostaDaIA }] });

        return res.status(200).json({ sucesso: true, resposta: respostaDaIA });
    } catch (erro) {
        console.error("❌ Erro no Controller:", erro);
        return res.status(500).json({ sucesso: false, erro: "Erro ao processar chat." });
    }
};

// NOVA FUNCIONALIDADE: Limpar Histórico
exports.limparHistorico = async (req, res) => {
    try {
        await Mensagem.deleteMany({});
        return res.status(200).json({ sucesso: true, mensagem: "Histórico apagado com sucesso!" });
    } catch (erro) {
        return res.status(500).json({ sucesso: false, erro: "Erro ao limpar banco." });
    }
};


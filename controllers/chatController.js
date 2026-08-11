exports.enviarMensagem = async (req, res) => {
    try {
        const { pergunta, nickname } = req.body;
        console.log(`--- Nova pergunta de ${nickname}: ${pergunta} ---`);

        // 1. Salva no banco
        await Mensagem.create({ role: "user", parts: [{ text: `[${nickname}]: ${pergunta}` }] });

        // 2. Busca e limpa o histórico para a IA não se confundir
        const historicoDB = await Mensagem.find().sort({ dataHora: 1 }).limit(10);
        const history = historicoDB.map(m => ({
            role: m.role === "model" ? "model" : "user", // Garante que o role seja aceito pelo Gemini
            parts: [{ text: m.parts[0].text }]
        }));

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            tools: [{ functionDeclarations: declaracoes }],
            systemInstruction: `Você é um Mestre de Jogo de RPG. Proponha desafios ao jogador ${nickname}. Se ele acertar, use 'adicionarXP' com 50. Se errar, use -10.`
        });

        const chat = model.startChat({ history });

        console.log("Aguardando resposta do Gemini...");
        let result = await chat.sendMessage(pergunta);
        let response = result.response;
        let parts = response.candidates[0].content.parts;

        // 3. Verifica se a IA quer chamar uma função (XP ou Clima)
        if (parts[0].functionCall) {
            const call = parts[0].functionCall;
            console.log(`IA chamando função: ${call.name}`);
            const acao = await ferramentasMap[call.name](call.args);
            
            // Envia o resultado da função de volta para a IA
            result = await chat.sendMessage([{
                functionResponse: { name: call.name, response: { content: acao } }
            }]);
        }

        const textoFinal = result.response.text();
        console.log("IA respondeu com sucesso!");

        await Mensagem.create({ role: "model", parts: [{ text: textoFinal }] });
        res.json({ sucesso: true, resposta: textoFinal });

    } catch (err) {
        console.error("❌ ERRO NO CONTROLLER:", err); // Isso vai mostrar o erro real no terminal
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};
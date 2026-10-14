const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    // Isso vai te ajudar a ver no terminal se o token está chegando certo
    console.log("Token recebido no servidor:", authHeader); 

    const token = authHeader && authHeader.split(' ')[1]; // Pega o código depois do 'Bearer'

    if (!token) {
        console.log("Erro: Token não fornecido");
        return res.status(401).json({ error: "Token não fornecido" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Erro: Token inválido");
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
};
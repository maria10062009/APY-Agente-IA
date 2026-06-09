const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Rota para conversar: POST /api/chat
router.post('/', chatController.enviarMensagem);

// Rota para limpar: DELETE /api/chat/limpar
router.delete('/limpar', chatController.limparHistorico);

module.exports = router;
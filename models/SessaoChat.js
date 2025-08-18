const mongoose = require('mongoose');

const sessaoChatSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    botId: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    titulo: { type: String, default: 'Conversa Sem Título', trim: true },
    messages: [{
        role: { type: String, required: true }, // 'user' ou 'assistant'
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    loggedAt: { type: Date, default: Date.now }
}, { 
    strict: false, // Permite campos não definidos no schema
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

const SessaoChat = mongoose.model('SessaoChat', sessaoChatSchema, 'sessoesChat');

module.exports = SessaoChat; 
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    nome: { type: String, default: '' },
    email: { type: String, default: '' },
    apelidoBot: { type: String, default: '' },
    // Instrução de sistema personalizada do usuário
    systemInstruction: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

module.exports = Usuario;



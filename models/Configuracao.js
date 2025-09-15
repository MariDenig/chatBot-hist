const mongoose = require('mongoose');

const configuracaoSchema = new mongoose.Schema({
    chave: { type: String, required: true, unique: true, index: true },
    valor: { type: mongoose.Schema.Types.Mixed, required: true },
    atualizadoEm: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Configuracao = mongoose.model('Configuracao', configuracaoSchema, 'configuracoes');

module.exports = Configuracao;



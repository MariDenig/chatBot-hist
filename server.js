require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const port = 3000;

// Middleware para processar JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Verificar chave de API
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("Erro: Chave de API do Google não encontrada. Verifique seu arquivo .env");
    process.exit(1);
}

// Inicializar cliente da API do Google
const genAI = new GoogleGenerativeAI(apiKey);

// Configurar modelo
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "Você é um chatbot historiador. Responda às perguntas dos usuários de forma informativa, precisa e envolvente, sempre com uma perspectiva histórica. Cite fontes ou períodos relevantes quando apropriado. Aja como um especialista apaixonado por história.",
});

// Rota para o chat
app.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ 
                error: 'Mensagem não fornecida',
                type: 'input_error'
            });
        }

        const chat = model.startChat({
            history: history,
            generationConfig: {
                temperature: 0.7,
            }
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Criar novo histórico
        const newHistory = [
            ...history,
            { role: "user", parts: [{ text: message }] },
            { role: "model", parts: [{ text: text }] }
        ];

        res.json({ 
            response: text,
            history: newHistory
        });
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        
        // Determinar o tipo de erro
        let errorType = 'api_error';
        let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
        
        if (error.message.includes('API key')) {
            errorType = 'auth_error';
            errorMessage = 'Erro de autenticação com a API. Verifique as configurações do servidor.';
        } else if (error.message.includes('network')) {
            errorType = 'network_error';
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }

        res.status(500).json({ 
            error: errorMessage,
            type: errorType
        });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Ocorreu um erro interno no servidor',
        type: 'server_error'
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 
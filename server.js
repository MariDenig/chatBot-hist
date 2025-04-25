require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Debug: Verificar se o arquivo .env está sendo carregado
console.log('Diretório atual:', __dirname);
console.log('Variáveis de ambiente carregadas:', process.env);

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
    model: "gemini-2.0-flash",
    systemInstruction: "Você é um chatbot historiador. Responda às perguntas dos usuários de forma informativa, precisa e envolvente, sempre com uma perspectiva histórica. Cite fontes ou períodos relevantes quando apropriado. Aja como um especialista apaixonado por história.",
});

// Rota para o chat
app.post('/chat', async (req, res) => {
    try {
        console.log('Recebida requisição POST para /chat');
        console.log('Corpo da requisição:', req.body);

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
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
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
        } else if (error.message.includes('quota')) {
            errorType = 'quota_error';
            errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
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
    console.error('Erro no servidor:', err.stack);
    res.status(500).json({ 
        error: 'Ocorreu um erro interno no servidor',
        type: 'server_error'
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 
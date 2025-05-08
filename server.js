const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
console.log('Procurando arquivo .env em:', envPath);
console.log('Arquivo .env existe?', fs.existsSync(envPath));

require('dotenv').config();

// Log de todas as variáveis de ambiente
console.log('Variáveis de ambiente carregadas:', {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Definida' : 'Não definida',
    NODE_ENV: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3000;

// Verificar se a chave API está configurada
if (!process.env.GOOGLE_API_KEY) {
    console.error('ERRO: GOOGLE_API_KEY não está definida no arquivo .env');
    console.error('Por favor, verifique se:');
    console.error('1. O arquivo .env existe no diretório:', __dirname);
    console.error('2. O arquivo .env contém a linha: GOOGLE_API_KEY=sua_chave_api');
    console.error('3. Não há espaços antes ou depois do sinal de igual');
    process.exit(1);
}

// Configurar Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Definir as ferramentas disponíveis
const tools = [
    {
        functionDeclarations: [
            {
                name: "getCurrentTime",
                description: "Obtém a data e hora atuais.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "searchHistory",
                description: "Pesquisa informações históricas sobre um tópico específico.",
                parameters: {
                    type: "object",
                    properties: {
                        topic: {
                            type: "string",
                            description: "O tópico histórico a ser pesquisado"
                        },
                        period: {
                            type: "string",
                            description: "O período histórico (opcional)",
                            enum: ["antiga", "medieval", "moderna", "contemporânea"]
                        }
                    },
                    required: ["topic"]
                }
            }
        ]
    }
];

// Funções disponíveis
const availableFunctions = {
    getCurrentTime: () => {
        console.log("Executando getCurrentTime");
        return { currentTime: new Date().toLocaleString() };
    },
    searchHistory: (args) => {
        console.log("Executando searchHistory com args:", args);
        // Aqui você implementaria a lógica real de pesquisa histórica
        return {
            topic: args.topic,
            period: args.period || "todos os períodos",
            results: `Informações históricas sobre ${args.topic} no período ${args.period || "todos os períodos"}`
        };
    }
};

// Função para gerar resposta usando Gemini
async function generateResponse(message, history) {
    try {
        console.log('Iniciando geração de resposta com Gemini...');
        console.log('Mensagem recebida:', message);
        console.log('Histórico recebido:', JSON.stringify(history, null, 2));

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            tools: tools
        });
        
        // Preparar o histórico no formato que o Gemini espera
        const formattedHistory = history?.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })) || [];

        console.log('Histórico formatado:', JSON.stringify(formattedHistory, null, 2));

        // Iniciar chat
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        console.log('Enviando mensagem para o Gemini...');
        // Gerar resposta
        const result = await chat.sendMessage(message);
        console.log('Resposta recebida do Gemini, processando...');
        const response = await result.response;
        
        // Verificar se há chamadas de função
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            console.log('Chamada de função detectada:', functionCalls[0]);
            
            // Executar a função
            const functionCall = functionCalls[0];
            const functionToCall = availableFunctions[functionCall.name];
            const functionArgs = functionCall.args;
            
            // Executar a função
            const functionResult = functionToCall(functionArgs);
            console.log('Resultado da função:', functionResult);
            
            // Enviar o resultado de volta para o Gemini
            const resultFromFunctionCall = await chat.sendMessage([
                {
                    functionResponse: {
                        name: functionCall.name,
                        response: functionResult
                    }
                }
            ]);
            
            // Obter a resposta final
            const finalResponse = await resultFromFunctionCall.response;
            console.log('Resposta final processada com sucesso');
            return finalResponse.text();
        }
        
        console.log('Resposta processada com sucesso');
        return response.text();
    } catch (error) {
        console.error('Erro detalhado ao gerar resposta:', error);
        console.error('Stack trace:', error.stack);
        if (error.message.includes('API key')) {
            throw new Error('Erro de autenticação com a API do Google. Verifique sua chave API.');
        }
        throw new Error(`Erro ao gerar resposta: ${error.message}`);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'chatBot-hist')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatBot-hist', 'index.html'));
});

// Rota para o chatbot
app.post('/chat', async (req, res) => {
    try {
        console.log('Recebida requisição POST em /chat');
        const { message, history } = req.body;
        console.log('Corpo da requisição:', { message, history });
        
        if (!message) {
            throw new Error('Mensagem não fornecida');
        }
        
        // Gerar resposta usando Gemini
        const botResponse = await generateResponse(message, history);
        console.log('Resposta gerada com sucesso:', botResponse);
        
        const response = {
            response: botResponse,
            history: [...(history || []), 
                { role: 'user', content: message }, 
                { role: 'assistant', content: botResponse }
            ]
        };
        
        console.log('Enviando resposta para o cliente');
        res.json(response);
    } catch (error) {
        console.error('Erro detalhado no endpoint /chat:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Chave API configurada:', process.env.GOOGLE_API_KEY ? 'Sim' : 'Não');
}); 
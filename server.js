const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');

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
            },
            {
                name: "getWeather",
                description: "Obtém a previsão do tempo atual para uma cidade específica.",
                parameters: {
                    type: "object",
                    properties: {
                        location: {
                            type: "string",
                            description: "A cidade para a qual obter a previsão do tempo (ex: 'Curitiba, BR')."
                        }
                    },
                    required: ["location"]
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
    },
    getWeather: async (args) => {
        console.log("Executando getWeather com args:", args);
        const location = args.location;
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            console.error("Chave da API OpenWeatherMap não configurada.");
            return { error: "Chave da API OpenWeatherMap não configurada." };
        }
        
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=pt_br`;
            const response = await axios.get(url);
            
            return {
                location: response.data.name,
                temperature: `${response.data.main.temp}°C`,
                description: response.data.weather[0].description,
                feels_like: `${response.data.main.feels_like}°C`,
                humidity: `${response.data.main.humidity}%`,
                wind_speed: `${response.data.wind.speed} m/s`
            };
        } catch (error) {
            console.error("Erro ao chamar OpenWeatherMap:", error.response?.data || error.message);
            return { 
                error: error.response?.data?.message || "Não foi possível obter o tempo para esta localização." 
            };
        }
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
            console.log(`Detectadas ${functionCalls.length} chamadas de função`);
            
            // Processa todas as chamadas de função uma por uma
            let currentResponse = response;
            
            for (const functionCall of functionCalls) {
                console.log('Processando chamada de função:', functionCall.name);
                
                // Obter a função correspondente
                const functionName = functionCall.name;
                const functionToCall = availableFunctions[functionName];
                
                if (!functionToCall) {
                    console.error(`Função ${functionName} não implementada`);
                    continue;
                }
                
                const functionArgs = functionCall.args;
                
                try {
                    // Executar a função (que pode ser assíncrona)
                    console.log(`Executando ${functionName} com args:`, functionArgs);
                    const functionResult = await functionToCall(functionArgs);
                    console.log(`Resultado de ${functionName}:`, functionResult);
                    
                    // Enviar o resultado de volta para o Gemini
                    const resultFromFunctionCall = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: functionName,
                                response: functionResult
                            }
                        }
                    ]);
                    
                    // Atualizar a resposta atual
                    currentResponse = await resultFromFunctionCall.response;
                    
                    // Verificar se há mais chamadas de função na resposta atual
                    const moreFunctionCalls = currentResponse.functionCalls();
                    if (moreFunctionCalls && moreFunctionCalls.length > 0) {
                        console.log(`Detectadas mais ${moreFunctionCalls.length} chamadas de função na resposta`);
                        // Elas serão processadas na próxima iteração
                    }
                } catch (error) {
                    console.error(`Erro ao executar a função ${functionName}:`, error);
                    // Informar o Gemini sobre o erro
                    const errorResponse = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: functionName,
                                response: { error: error.message || "Erro ao executar a função" }
                            }
                        }
                    ]);
                    currentResponse = await errorResponse.response;
                }
            }
            
            console.log('Resposta final processada com sucesso');
            return currentResponse.text();
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
app.use(express.static(path.join(__dirname, '')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'index.html'));
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
        
        // Atualizar o histórico de conversação
        // Nota: Aqui estamos simplificando o histórico para o frontend
        // Na realidade, também deveria incluir as chamadas de função e respostas
        // para manter o contexto completo, mas isso tornaria a interface mais complexa
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

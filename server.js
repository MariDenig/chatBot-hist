const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
console.log('Procurando arquivo .env em:', envPath);
console.log('Arquivo .env existe?', fs.existsSync(envPath));

require('dotenv').config();

// Log de todas as variáveis de ambiente
console.log('Variáveis de ambiente carregadas:', {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Definida' : 'Não definida',
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI: process.env.MONGO_URI ? 'Definida' : 'Não definida'
});

// Configuração do MongoDB com Mongoose
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Definir o Schema para os logs de acesso
const LogAcessoSchema = new mongoose.Schema({
    col_data: { type: String, required: true },
    col_hora: { type: String, required: true },
    col_IP: { type: String, required: true },
    col_nome_bot: { type: String, required: true },
    col_acao: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// Criar o Model
const LogAcesso = mongoose.model('LogAcesso', LogAcessoSchema, 'tb_cl_user_log_acess');

// Array para simular o armazenamento do ranking
let dadosRankingVitrine = [];
let isMongoConnected = false;
// Função para conectar ao MongoDB usando Mongoose
async function connectDB() {
    try {
        if (!isMongoConnected) {
            console.log('Tentando conectar ao MongoDB com URI:', process.env.MONGO_URI);
            
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            isMongoConnected = true;
            console.log('Conectado ao MongoDB Atlas via Mongoose!');
        }
        return mongoose.connection.db;
    } catch (error) {
        isMongoConnected = false;
        console.error('Erro detalhado ao conectar ao MongoDB:', error);
        throw error;
    }
}

const app = express();
const PORT = process.env.PORT || 3001;

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
            return { 
                error: "Não foi possível verificar o clima porque a chave da API OpenWeatherMap não está configurada. Por favor, adicione OPENWEATHER_API_KEY=sua_chave no arquivo .env" 
            };
        }

        // Função auxiliar para fazer a requisição
        const makeWeatherRequest = async (searchLocation) => {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchLocation)}&appid=${apiKey}&units=metric&lang=pt_br`;
            console.log('Fazendo requisição para:', url);
            const response = await axios.get(url);
            console.log('Resposta da API:', response.data);
            return response;
        };
        
        try {
            // Primeira tentativa: com o país
            const formattedLocation = location.includes(', BR') ? location : `${location}, BR`;
            console.log('Primeira tentativa - Buscando clima para:', formattedLocation);
            
            try {
                const response = await makeWeatherRequest(formattedLocation);
                if (!response.data || !response.data.main) {
                    throw new Error('Dados do clima não disponíveis');
                }

                return {
                    location: response.data.name,
                    temperature: `${Math.round(response.data.main.temp)}°C`,
                    description: response.data.weather[0].description,
                    feels_like: `${Math.round(response.data.main.feels_like)}°C`,
                    humidity: `${response.data.main.humidity}%`,
                    wind_speed: `${response.data.wind.speed} m/s`
                };
            } catch (firstError) {
                console.log('Primeira tentativa falhou:', firstError.message);
                
                // Segunda tentativa: sem o país
                console.log('Segunda tentativa - Buscando clima para:', location);
                const retryResponse = await makeWeatherRequest(location);
                
                if (!retryResponse.data || !retryResponse.data.main) {
                    throw new Error('Dados do clima não disponíveis');
                }

                return {
                    location: retryResponse.data.name,
                    temperature: `${Math.round(retryResponse.data.main.temp)}°C`,
                    description: retryResponse.data.weather[0].description,
                    feels_like: `${Math.round(retryResponse.data.main.feels_like)}°C`,
                    humidity: `${retryResponse.data.main.humidity}%`,
                    wind_speed: `${retryResponse.data.wind.speed} m/s`
                };
            }
        } catch (error) {
            console.error("Erro detalhado ao chamar OpenWeatherMap:", error);
            console.error("Resposta de erro:", error.response?.data);
            
            if (error.response?.status === 404) {
                return { 
                    error: `Não foi possível encontrar informações sobre o clima para "${location}". Por favor, verifique se o nome da cidade está correto e tente novamente.` 
                };
            }
            
            if (error.response?.status === 401) {
                return { 
                    error: "Não foi possível verificar o clima porque a chave da API OpenWeatherMap é inválida. Por favor, verifique sua chave API." 
                };
            }

            if (error.response?.status === 429) {
                return {
                    error: "Limite de requisições excedido. Por favor, aguarde alguns minutos e tente novamente."
                };
            }

            return { 
                error: `Desculpe, ocorreu um erro ao tentar obter o clima para "${location}". Detalhes: ${error.message}. Por favor, tente novamente em alguns instantes.` 
            };
        }
    }
};

// Função para gerar resposta usando Gemini
async function generateResponse(message, history) {
    try {
        console.log('Iniciando geração de resposta...');
        console.log('Mensagem recebida:', message);

        // Verificar se é uma solicitação de tempo
        if (message.toLowerCase().includes('horas') || message.toLowerCase().includes('hora atual')) {
            const timeResult = availableFunctions.getCurrentTime();
            return `A hora atual é: ${timeResult.currentTime}`;
        }

        // Verificar se é uma solicitação de clima
        if (message.toLowerCase().includes('clima') || message.toLowerCase().includes('tempo')) {
            // Extrair a localização da mensagem com melhor tratamento
            const locationMatch = message.match(/em\s+([^,.?!]+)/i);
            let location = locationMatch ? locationMatch[1].trim() : 'Curitiba, BR';
            
            // Remover caracteres especiais e pontuação
            location = location.replace(/[.,!?]/g, '').trim();
            
            console.log('Localização extraída e limpa:', location);
            
            const weatherResult = await availableFunctions.getWeather({ location });
            if (weatherResult.error) {
                return weatherResult.error;
            }
            return `Clima em ${weatherResult.location}:\nTemperatura: ${weatherResult.temperature}\nSensação térmica: ${weatherResult.feels_like}\nCondição: ${weatherResult.description}\nUmidade: ${weatherResult.humidity}\nVelocidade do vento: ${weatherResult.wind_speed}`;
        }

        // Se não for uma função especial, usar o Gemini
        console.log('Usando Gemini para resposta...');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash"
        });

        // Preparar o prompt
        const prompt = `Você é um historiador especializado. Responda à seguinte pergunta de forma detalhada e precisa:
${message}`;

        // Gerar resposta
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        console.log('Resposta do Gemini:', response);

        // Extrair o texto da resposta
        if (response.text) {
            return response.text();
        }

        // Se não encontrar o texto diretamente, tentar outras estruturas
        if (response.candidates && response.candidates[0]) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                return candidate.content.parts[0].text;
            }
        }

        throw new Error('Não foi possível extrair a resposta do Gemini');

    } catch (error) {
        console.error('Erro detalhado ao gerar resposta:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.message.includes('API key')) {
            throw new Error('Erro de autenticação com a API do Google. Verifique sua chave API.');
        }
        
        throw new Error(`Erro ao gerar resposta: ${error.message}`);
    }
}

// Configuração do CORS
app.use(cors({
    origin: ['https://chatbot-historia.onrender.com', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Rota principal
app.get('/', (req, res) => {
    console.log('Acessando rota principal');
    res.sendFile(path.join(__dirname, '', 'index.html'));
});

// Rota para verificar status do servidor
app.get('/status', (req, res) => {
    const status = {
        status: 'online',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: isMongoConnected ? 'connected' : 'disconnected',
        apis: {
            google: process.env.GOOGLE_API_KEY ? 'configured' : 'not configured',
            openweather: process.env.OPENWEATHER_API_KEY ? 'configured' : 'not configured'
        }
    };
    res.json(status);
});

// Rota para o chatbot
app.post('/chat', async (req, res) => {
    try {
        console.log('Recebida requisição POST em /chat');
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Mensagem não fornecida',
                details: 'Por favor, digite uma mensagem para que eu possa ajudá-lo.'
            });
        }

        const botResponse = await generateResponse(message, history);
        
        // Determinar o tipo de interação
        let tipo = 'geral';
        if (message.toLowerCase().includes('clima') || message.toLowerCase().includes('tempo')) {
            tipo = 'clima';
        } else if (message.toLowerCase().includes('horas') || message.toLowerCase().includes('hora atual')) {
            tipo = 'hora';
        } else if (message.toLowerCase().includes('história') || message.toLowerCase().includes('histórico')) {
            tipo = 'historico';
        }

        // Salvar a interação no histórico
        try {
            const db = await connectDB();
            const collection = db.collection('tb_chat_historico');
            await collection.insertOne({
                data: new Date().toISOString().split('T')[0],
                hora: new Date().toTimeString().split(' ')[0],
                pergunta: message,
                resposta: botResponse,
                tipo: tipo,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Erro ao salvar histórico do chat:', error);
            // Não interrompe o fluxo se falhar ao salvar o histórico
        }

        const response = {
            response: botResponse,
            history: [...(history || []), 
                { role: 'user', content: message }, 
                { role: 'assistant', content: botResponse }
            ]
        };

        res.json(response);

    } catch (error) {
        console.error('Erro no endpoint /chat:', error);
        let errorMessage = 'Desculpe, ocorreu um erro ao processar sua solicitação.';
        let errorDetails = 'Por favor, tente novamente mais tarde.';

        if (error.message.includes('API key')) {
            errorMessage = 'Erro de configuração do sistema';
            errorDetails = 'A chave da API do Google não está configurada corretamente. Por favor, verifique o arquivo .env.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Erro de conexão';
            errorDetails = 'Não foi possível conectar ao servidor. Por favor, verifique se o servidor está rodando e tente novamente.';
        }

        res.status(500).json({ 
            error: errorMessage,
            details: errorDetails
        });
    }
});

// Endpoint para registrar logs de acesso
app.post('/api/log-connection', async (req, res) => {
    try {
        const { ip, acao, nomeBot } = req.body;

        if (!ip || !acao || !nomeBot) {
            return res.status(400).json({ 
                error: "Dados de log incompletos (IP, ação e nome do bot são obrigatórios)." 
            });
        }

        const agora = new Date();
        const dataFormatada = agora.toISOString().split('T')[0];
        const horaFormatada = agora.toTimeString().split(' ')[0];

        const novoLog = new LogAcesso({
            col_data: dataFormatada,
            col_hora: horaFormatada,
            col_IP: ip,
            col_nome_bot: 'Mari_Chatbot',
            col_acao: acao
        });

        await novoLog.save();
        console.log('Log registrado com sucesso:', novoLog);
        
        res.status(201).json({ 
            message: 'Log registrado com sucesso',
            data: novoLog
        });
    } catch (error) {
        console.error('Erro ao registrar log:', error);
        res.status(500).json({ 
            error: 'Erro ao registrar log',
            details: error.message 
        });
    }
});

// Endpoint para registrar acesso ao bot para ranking
app.post('/api/ranking/registrar-acesso-bot', (req, res) => {
    const { botId, nomeBot, timestampAcesso, usuarioId } = req.body;

    if (!botId || !nomeBot) {
        return res.status(400).json({ error: "ID e Nome do Bot são obrigatórios para o ranking." });
    }

    const acesso = {
        botId,
        nomeBot,
        usuarioId: usuarioId || 'anonimo',
        acessoEm: timestampAcesso ? new Date(timestampAcesso) : new Date(),
        contagem: 1
    };

    const botExistente = dadosRankingVitrine.find(b => b.botId === botId);
    if (botExistente) {
        botExistente.contagem += 1;
        botExistente.ultimoAcesso = acesso.acessoEm;
    } else {
        dadosRankingVitrine.push({
            botId: botId,
            nomeBot: nomeBot,
            contagem: 1,
            ultimoAcesso: acesso.acessoEm
        });
    }
    
    console.log('[Servidor] Dados de ranking atualizados:', dadosRankingVitrine);
    res.status(201).json({ message: `Acesso ao bot ${nomeBot} registrado para ranking.` });
});

// Endpoint para visualizar o ranking
app.get('/api/ranking/visualizar', (req, res) => {
    const rankingOrdenado = [...dadosRankingVitrine].sort((a, b) => b.contagem - a.contagem);
    res.json(rankingOrdenado);
});

// Endpoint para armazenar perguntas e respostas do chatbot
app.post('/api/chat/historico', async (req, res) => {
    try {
        const { pergunta, resposta, tipo } = req.body;

        if (!pergunta || !resposta) {
            return res.status(400).json({ 
                error: "Dados incompletos. Pergunta e resposta são obrigatórios." 
            });
        }

        const agora = new Date();
        const dataFormatada = agora.toISOString().split('T')[0]; // YYYY-MM-DD
        const horaFormatada = agora.toTimeString().split(' ')[0]; // HH:MM:SS

        const chatEntry = {
            data: dataFormatada,
            hora: horaFormatada,
            pergunta: pergunta,
            resposta: resposta,
            tipo: tipo || 'geral', // tipo pode ser: clima, hora, histórico, geral
            timestamp: agora
        };

        const db = await connectDB();
        const collection = db.collection('tb_chat_historico');
        await collection.insertOne(chatEntry);

        console.log('Histórico do chat registrado com sucesso:', chatEntry);
        res.status(201).json({ 
            message: 'Histórico do chat registrado com sucesso',
            data: chatEntry
        });
    } catch (error) {
        console.error('Erro ao registrar histórico do chat:', error);
        res.status(500).json({ 
            error: 'Erro ao registrar histórico do chat',
            details: error.message 
        });
    }
});

// Endpoint para buscar histórico do chat
app.get('/api/chat/historico', async (req, res) => {
    try {
        const { data, tipo, limit = 50 } = req.query;
        
        const query = {};
        if (data) query.data = data;
        if (tipo) query.tipo = tipo;

        const db = await connectDB();
        const collection = db.collection('tb_chat_historico');
        
        const historico = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();

        res.json({
            total: historico.length,
            historico: historico
        });
    } catch (error) {
        console.error('Erro ao buscar histórico do chat:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar histórico do chat',
            details: error.message 
        });
    }
});

// Endpoint para visualizar logs
app.get('/api/logs', async (req, res) => {
    try {
        const { data, nomeBot, limit = 50 } = req.query;
        
        const query = {};
        if (data) query.col_data = data;
        if (nomeBot) query.col_nome_bot = nomeBot;

        const db = await connectDB();
        const collection = db.collection('tb_cl_user_log_acess');
        
        const logs = await collection
            .find(query)
            .sort({ col_data: -1, col_hora: -1 })
            .limit(parseInt(limit))
            .toArray();

        res.json({
            total: logs.length,
            logs: logs
        });
    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar logs',
            details: error.message 
        });
    }
});

// Adicione este endpoint para testar a conexão
app.get('/test-mongo', async (req, res) => {
    try {
        if (!isMongoConnected) {
            await connectDB();
        }
        res.json({ 
            status: 'success', 
            message: 'Conexão com MongoDB estabelecida',
            isConnected: isMongoConnected
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Erro ao conectar com MongoDB',
            error: error.message
        });
    }
});

// Iniciar o servidor
const server = app.listen(PORT, async () => {
    try {
        console.log('='.repeat(50));
        console.log('Iniciando servidor...');
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log('Tentando conectar ao MongoDB...');
        
        // Verificar se a string de conexão está definida
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI não está definida no arquivo .env');
        }
        
        await connectDB();
        console.log('Servidor iniciado com sucesso!');
        console.log('Configurações:');
        console.log('- Porta:', PORT);
        console.log('- MongoDB:', isMongoConnected ? 'Conectado' : 'Não conectado');
        console.log('- Google API:', process.env.GOOGLE_API_KEY ? 'Configurada' : 'Não configurada');
        console.log('- Ambiente:', process.env.NODE_ENV || 'development');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
    isMongoConnected = false;
});

process.on('unhandledRejection', (error) => {
    console.error('Promessa rejeitada não tratada:', error);
    isMongoConnected = false;
});

// Tratamento de desconexão do MongoDB
mongoose.connection.on('close', () => {
    console.log('Conexão com MongoDB fechada');
    isMongoConnected = false;
});

mongoose.connection.on('error', (error) => {
    console.error('Erro na conexão com MongoDB:', error);
    isMongoConnected = false;
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
    console.log('Sinal SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        mongoose.connection.close();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Sinal SIGINT recebido. Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        mongoose.connection.close();
        process.exit(0);
    });
}); 

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const mongooseProf = require('mongoose');
const SessaoChat = require('./models/SessaoChat');
const Configuracao = require('./models/Configuracao');
const Usuario = require('./models/Usuario');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
console.log('Procurando arquivo .env em:', envPath);
console.log('Arquivo .env existe?', fs.existsSync(envPath));

require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'troque-esta-senha';

// Configuração do CORS
app.use(cors({
    origin: (origin, callback) => {
        // Permitir chamadas sem origem (file://, ferramentas) e origens conhecidas
        const allowed = [
            'https://chat-bot-hist.vercel.app',
            'https://chatbot-historia.onrender.com',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ];
        if (!origin || allowed.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
// Log de todas as variáveis de ambiente
console.log('Variáveis de ambiente carregadas:', {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Definida' : 'Não definida',
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI: process.env.MONGO_URI_mari ? 'Definida' : 'Não definida'
});

// Configuração do MongoDB com Mongoose
const mongoUri = process.env.MONGO_URI_mari;
const mongoUriProf = process.env.MONGO_URI_prof || 'mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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

// Conexão separada para o banco do professor
let isProfConnected = false;
let ProfLogAcesso;
async function connectProfDB() {
    if (!isProfConnected) {
        try {
            await mongooseProf.connect(process.env.MONGO_URI_prof, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                dbName: 'IIW2023A_Logs'
            });
            isProfConnected = true;
            // Schema simples para logs de acesso
            const ProfLogAcessoSchema = new mongooseProf.Schema({
                col_data: String,
                col_hora: String,
                col_IP: String,
                col_nome_bot: String,
                col_acao: String,
                timestamp: { type: Date, default: Date.now }
            });
            ProfLogAcesso = mongooseProf.model('ProfLogAcesso', ProfLogAcessoSchema, 'tb_cl_user_log_acess');
            console.log('Conectado ao MongoDB do professor!');
        } catch (err) {
            isProfConnected = false;
            console.error('Erro ao conectar ao MongoDB do professor:', err);
        }
    }
}

// Array para simular o armazenamento do ranking
let dadosRankingVitrine = [];
let isMongoConnected = false;
// Função para conectar ao MongoDB usando Mongoose
async function connectDB() {
    try {
        if (!isMongoConnected) {
            console.log('Tentando conectar ao MongoDB com URI:', process.env.MONGO_URI_mari);
            
            // Adicionar timeout e opções de reconexão
            await mongoose.connect(process.env.MONGO_URI_mari, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000, // 10 segundos timeout
                socketTimeoutMS: 45000, // 45 segundos timeout para operações
                connectTimeoutMS: 10000, // 10 segundos para conexão inicial
                maxPoolSize: 10, // Máximo de conexões no pool
                minPoolSize: 1, // Mínimo de conexões no pool
                maxIdleTimeMS: 30000, // 30 segundos para conexões ociosas
                retryWrites: true,
                w: 'majority'
            });
            
            isMongoConnected = true;
            console.log('Conectado ao MongoDB Atlas via Mongoose!');
        }
        return mongoose.connection.db;
    } catch (error) {
        isMongoConnected = false;
        console.error('Erro detalhado ao conectar ao MongoDB:', error);
        console.log('⚠️  AVISO: Servidor continuará funcionando sem MongoDB. Algumas funcionalidades podem não estar disponíveis.');
        console.log('💡 Para resolver: Verifique sua string de conexão e adicione seu IP à whitelist do MongoDB Atlas');
        
        // Tentar reconectar automaticamente após 30 segundos
        setTimeout(async () => {
            console.log('Tentando reconectar ao MongoDB...');
            try {
                await connectDB();
            } catch (reconnectError) {
                console.log('Reconexão falhou, tentando novamente em 60 segundos...');
            }
        }, 30000);
        
        // Não lança erro para permitir que o servidor continue
        return null;
    }
}


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

// Utilitários de formatação para evitar dependência do locale do sistema
function formatDateTimeInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value || '';
    let hour = parseInt(get('hour') || '0', 10);
    const minute = get('minute');
    const second = get('second');
    const day = get('day');
    const month = get('month');
    const year = get('year');
    const dayPeriod = (get('dayPeriod') || '').toUpperCase();

    // Converter para 24h
    if (dayPeriod === 'PM' && hour < 12) hour += 12;
    if (dayPeriod === 'AM' && hour === 12) hour = 0;

    const hh = String(hour).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${minute}:${second}`;
}

function formatTimeInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type)?.value || '';
    let hour = parseInt(get('hour') || '0', 10);
    const minute = get('minute');
    const second = get('second');
    const dayPeriod = (get('dayPeriod') || '').toUpperCase();

    if (dayPeriod === 'PM' && hour < 12) hour += 12;
    if (dayPeriod === 'AM' && hour === 12) hour = 0;

    const hh = String(hour).padStart(2, '0');
    return `${hh}:${minute}:${second}`;
}

// Definir as ferramentas disponíveis
const tools = [    {
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
// Armazenamento em memória para fallback quando Mongo não está disponível
const inMemorySessions = new Map();

const availableFunctions = {
    getCurrentTime: async () => {
        console.log("Executando getCurrentTime");
        // Tentar WorldTimeAPI para garantir fuso e data corretos
        try {
            const { data } = await axios.get('https://worldtimeapi.org/api/timezone/America/Sao_Paulo', { timeout: 8000 });
            // data.datetime é ISO, ex: 2025-08-25T14:06:38.123456-03:00
            const iso = data.datetime;
            const dt = new Date(iso);
            return { currentTime: formatDateTimeInTimeZone(dt, 'America/Sao_Paulo') };
        } catch (e) {
            console.warn('WorldTimeAPI falhou, usando Intl local:', e.message);
            const now = new Date();
            return { currentTime: formatDateTimeInTimeZone(now, 'America/Sao_Paulo') };
        }
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

        // Função auxiliar para fazer a requisição com timeout
        const makeWeatherRequest = async (searchLocation) => {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchLocation)}&appid=${apiKey}&units=metric&lang=pt_br`;
            console.log('Fazendo requisição para:', url);
            
            // Adicionar timeout de 10 segundos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await axios.get(url, { 
                    signal: controller.signal,
                    timeout: 10000 
                });
                clearTimeout(timeoutId);
                console.log('Resposta da API:', response.data);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
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

                // Converter timestamp para hora local brasileira (sem ajuste manual)
                const timestamp = response.data.dt;
                const date = new Date(timestamp * 1000);
                const horaAtualizacao = formatTimeInTimeZone(date, 'America/Sao_Paulo');

                return {
                    location: response.data.name,
                    temperature: `${Math.round(response.data.main.temp)}°C`,
                    description: response.data.weather[0].description,
                    feels_like: `${Math.round(response.data.main.feels_like)}°C`,
                    humidity: `${response.data.main.humidity}%`,
                    wind_speed: `${response.data.wind.speed} m/s`,
                    updated_at: horaAtualizacao
                };
            } catch (firstError) {
                console.log('Primeira tentativa falhou:', firstError.message);
                
                // Segunda tentativa: sem o país
                console.log('Segunda tentativa - Buscando clima para:', location);
                const retryResponse = await makeWeatherRequest(location);
                
                if (!retryResponse.data || !retryResponse.data.main) {
                    throw new Error('Dados do clima não disponíveis');
                }

                // Converter timestamp para hora local brasileira (sem ajuste manual)
                const timestamp = retryResponse.data.dt;
                const date = new Date(timestamp * 1000);
                const horaAtualizacao = formatTimeInTimeZone(date, 'America/Sao_Paulo');

                return {
                    location: retryResponse.data.name,
                    temperature: `${Math.round(retryResponse.data.main.temp)}°C`,
                    description: retryResponse.data.weather[0].description,
                    feels_like: `${Math.round(retryResponse.data.main.feels_like)}°C`,
                    humidity: `${retryResponse.data.main.humidity}%`,
                    wind_speed: `${retryResponse.data.wind.speed} m/s`,
                    updated_at: horaAtualizacao
                };
            }
        } catch (error) {
            console.error("Erro detalhado ao chamar OpenWeatherMap:", error);
            console.error("Resposta de erro:", error.response?.data);
            
            if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
                return { 
                    error: `Timeout ao buscar informações do clima para "${location}". A requisição demorou muito para responder. Tente novamente.` 
                };
            }
            
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

// Utilitário: obter instrução de sistema do usuário, se existir
async function getUserInstruction(userId) {
    try {
        if (!isMongoConnected) return null;
        if (!userId) return null;
        const usuario = await Usuario.findOne({ userId: String(userId) });
        const texto = usuario?.systemInstruction;
        if (texto && typeof texto === 'string' && texto.trim()) return texto.trim();
        return null;
    } catch (e) {
        console.warn('Falha ao carregar systemInstruction do usuário:', e.message);
        return null;
    }
}

// Função para gerar resposta usando Gemini
async function generateResponse(message, history, userId) {
    try {
        console.log('Iniciando geração de resposta...');
        console.log('Mensagem recebida:', message);

        // Verificar se é uma solicitação de tempo
        if (message.toLowerCase().includes('horas') || message.toLowerCase().includes('hora atual')) {
            const timeResult = await availableFunctions.getCurrentTime();
            return `A hora atual é: ${timeResult.currentTime}`;
        }

        // Verificar se é uma solicitação de clima (mais específica)
        const climaKeywords = ['clima', 'tempo', 'temperatura', 'previsão do tempo', 'como está o tempo'];
        const isClimaRequest = climaKeywords.some(keyword => 
            message.toLowerCase().includes(keyword) && 
            (message.toLowerCase().includes('em ') || message.toLowerCase().includes('para '))
        );
        
        if (isClimaRequest) {
            // Extrair a localização da mensagem com melhor tratamento
            const locationMatch = message.match(/(?:em|para)\s+([^,.?!]+)/i);
            let location = locationMatch ? locationMatch[1].trim() : 'Curitiba, BR';
            
            // Remover caracteres especiais e pontuação
            location = location.replace(/[.,!?]/g, '').trim();
            
            console.log('Localização extraída e limpa:', location);
            
            const weatherResult = await availableFunctions.getWeather({ location });
            if (weatherResult.error) {
                return weatherResult.error;
            }
            return `Clima em ${weatherResult.location}:\nTemperatura: ${weatherResult.temperature}\nSensação térmica: ${weatherResult.feels_like}\nCondição: ${weatherResult.description}\nUmidade: ${weatherResult.humidity}\nVelocidade do vento: ${weatherResult.wind_speed}\nAtualizado às: ${weatherResult.updated_at}`;
        }

        // Se não for uma função especial, usar o Gemini
        console.log('Usando Gemini para resposta...');
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash"
        });

        // Preparar o prompt com timeout
        // Carregar instrução do usuário, senão global
        const userInstr = await getUserInstruction(userId);
        const globalInstr = await getSystemInstruction();
        const baseInstrucao = (userInstr && userInstr.trim())
            ? userInstr.trim()
            : (globalInstr && globalInstr.trim())
                ? globalInstr.trim()
                : 'Você é um historiador especializado. Responda de forma clara, precisa e didática.';

        const prompt = `${baseInstrucao}\n\nPergunta do usuário:\n${message}`;

        // Gerar resposta com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            clearTimeout(timeoutId);
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
        } catch (timeoutError) {
            clearTimeout(timeoutId);
            if (timeoutError.name === 'AbortError') {
                throw new Error('Timeout: A resposta demorou muito para ser gerada. Tente novamente.');
            }
            throw timeoutError;
        }

    } catch (error) {
        console.error('Erro detalhado ao gerar resposta:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.message.includes('API key')) {
            throw new Error('Erro de autenticação com a API do Google. Verifique sua chave API.');
        }
        
        if (error.message.includes('Timeout')) {
            throw new Error('A resposta demorou muito para ser gerada. Tente novamente.');
        }
        
        throw new Error(`Erro ao gerar resposta: ${error.message}`);
    }
}



// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Evitar 404 de favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rota principal
app.get('/', (req, res) => {
    console.log('Acessando rota principal');
    res.sendFile(path.join(__dirname, '', 'index.html'));
});

// Rota para servir a página de administração
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '', 'admin.html'));
});

// Middleware simples para identificar usuário (ex.: via header x-user-id)
function requireUser(req, res, next) {
    if (!isMongoConnected) return res.status(503).json({ error: 'MongoDB indisponível' });
    const userId = req.headers['x-user-id'];
    if (!userId || !String(userId).trim()) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    req.userId = String(userId).trim();
    return next();
}

// Middleware simples de autenticação de administrador por header
function requireAdmin(req, res, next) {
    const provided = req.headers['x-admin-secret'] || req.query.admin_secret;
    if (!provided || String(provided) !== String(ADMIN_SECRET)) {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    return next();
}

// Utilitário: obter instrução de sistema global
async function getSystemInstruction() {
    try {
        if (!isMongoConnected) return null;
        const cfg = await Configuracao.findOne({ chave: 'system_instruction' });
        if (cfg && cfg.valor && typeof cfg.valor === 'string' && cfg.valor.trim()) {
            return cfg.valor.trim();
        }
        return null;
    } catch (e) {
        console.warn('Falha ao carregar system_instruction:', e.message);
        return null;
    }
}

// Endpoints de administração
// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        // Se Mongo indisponível, retornar métricas básicas de memória
        if (!isMongoConnected) {
            const totalMem = inMemorySessions.size;
            const ultimasMem = Array.from(inMemorySessions.values())
                .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
                .slice(0, 5)
                .map(s => ({
                    sessionId: s.sessionId,
                    titulo: s.titulo || 'Conversa Sem Título',
                    startTime: s.startTime,
                    messages: s.messages?.length || 0
                }));
            return res.json({
                mongoConnected: false,
                totalConversas: totalMem,
                totalMensagens: ultimasMem.reduce((acc, s) => acc + s.messages, 0),
                ultimasConversas: ultimasMem
            });
        }

        const totalConversas = await SessaoChat.countDocuments({});
        // Total mensagens: somatório do tamanho do array messages
        const agg = await SessaoChat.aggregate([
            { $project: { count: { $size: { $ifNull: ['$messages', []] } }, startTime: 1, titulo: 1, sessionId: 1 } },
            { $facet: {
                totalMensagens: [ { $group: { _id: null, total: { $sum: '$count' } } } ],
                ultimas: [ { $sort: { startTime: -1 } }, { $limit: 5 } ]
            } }
        ]);

        const totalMensagens = agg[0]?.totalMensagens?.[0]?.total || 0;
        const ultimas = (agg[0]?.ultimas || []).map(s => ({
            sessionId: s.sessionId,
            titulo: s.titulo || 'Conversa Sem Título',
            startTime: s.startTime,
            messages: s.count
        }));

        res.json({
            mongoConnected: true,
            totalConversas,
            totalMensagens,
            ultimasConversas: ultimas
        });
    } catch (error) {
        console.error('Erro em /api/admin/stats:', error);
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// GET /api/admin/dashboard - Dashboard Estratégico com Métricas Avançadas
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
    try {
        console.log('🎯 Iniciando coleta de dados para Dashboard Estratégico...');
        
        // Se Mongo indisponível, retornar métricas básicas de memória
        if (!isMongoConnected) {
            const totalMem = inMemorySessions.size;
            const ultimasMem = Array.from(inMemorySessions.values())
                .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
                .slice(0, 5);
            
            const totalMensagensMem = ultimasMem.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
            const duracaoMediaMem = totalMem > 0 ? Math.round(totalMensagensMem / totalMem * 10) / 10 : 0;
            
            return res.json({
                mongoConnected: false,
                // Métricas básicas
                totalConversas: totalMem,
                totalMensagens: totalMensagensMem,
                ultimasConversas: ultimasMem.map(s => ({
                    sessionId: s.sessionId,
                    titulo: s.titulo || 'Conversa Sem Título',
                    startTime: s.startTime,
                    messages: s.messages?.length || 0
                })),
                // Métricas avançadas (simuladas para memória)
                duracaoMedia: duracaoMediaMem,
                conversasCurtas: Math.floor(totalMem * 0.6),
                conversasLongas: Math.floor(totalMem * 0.4),
                topUsuarios: [],
                conversasComFalha: [],
                respostasInconclusivas: 0
            });
        }

        // 🎯 CONSULTAS DE AGREGAÇÃO AVANÇADAS - SALA DE GUERRA DE DADOS
        
        // 1. PROFUNDIDADE DE ENGAJAMENTO - Análise de Duração das Conversas
        console.log('📊 Analisando profundidade de engajamento...');
        const profundidadeEngajamento = await SessaoChat.aggregate([
            {
                $project: {
                    numeroDeMensagens: { $size: { $ifNull: ['$messages', []] } },
                    sessionId: 1,
                    startTime: 1,
                    titulo: 1
                }
            },
            {
                $facet: {
                    // Duração média das conversas
                    duracaoMedia: [
                        { $group: { _id: null, media: { $avg: '$numeroDeMensagens' } } }
                    ],
                    // Contagem de conversas curtas vs longas
                    distribuicao: [
                        {
                            $group: {
                                _id: {
                                    $cond: [
                                        { $lte: ['$numeroDeMensagens', 3] },
                                        'curtas',
                                        'longas'
                                    ]
                                },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Distribuição detalhada
                    distribuicaoDetalhada: [
                        {
                            $bucket: {
                                groupBy: '$numeroDeMensagens',
                                boundaries: [0, 2, 5, 10, 20, 50, 100],
                                default: 'muito_longas',
                                output: {
                                    count: { $sum: 1 },
                                    exemplos: { $push: { sessionId: '$sessionId', titulo: '$titulo', mensagens: '$numeroDeMensagens' } }
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        // 2. LEALDADE DO USUÁRIO - Top Usuários Mais Ativos
        console.log('👥 Identificando usuários mais leais...');
        const lealdadeUsuario = await SessaoChat.aggregate([
            {
                $project: {
                    sessionId: 1,
                    numeroDeMensagens: { $size: { $ifNull: ['$messages', []] } },
                    startTime: 1,
                    titulo: 1
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    totalSessoes: { $sum: 1 },
                    totalMensagens: { $sum: '$numeroDeMensagens' },
                    ultimaAtividade: { $max: '$startTime' },
                    titulos: { $push: '$titulo' }
                }
            },
            {
                $project: {
                    userId: '$_id',
                    totalSessoes: 1,
                    totalMensagens: 1,
                    ultimaAtividade: 1,
                    tituloMaisRecente: { $arrayElemAt: ['$titulos', 0] },
                    engajamentoScore: {
                        $add: [
                            { $multiply: ['$totalSessoes', 2] },
                            { $multiply: ['$totalMensagens', 0.1] }
                        ]
                    }
                }
            },
            { $sort: { engajamentoScore: -1 } },
            { $limit: 5 }
        ]);

        // 3. ANÁLISE DE FALHAS - Detecção de Respostas Inconclusivas
        console.log('🔍 Analisando falhas do bot...');
        const analiseFalhas = await SessaoChat.aggregate([
            {
                $unwind: '$messages'
            },
            {
                $match: {
                    'messages.role': 'assistant'
                }
            },
            {
                $project: {
                    sessionId: 1,
                    content: '$messages.content',
                    timestamp: '$messages.timestamp',
                    titulo: 1
                }
            },
            {
                $match: {
                    $or: [
                        { content: { $regex: /não entendi|não posso ajudar|não sei|desculpe.*não|pode reformular|não tenho informações/i } },
                        { content: { $regex: /não consigo|não tenho acesso|não posso responder|não tenho dados/i } },
                        { content: { $regex: /erro|falha|problema|não funcionou/i } },
                        { content: { $regex: /^.{1,20}$/ } } // Respostas muito curtas (≤20 caracteres)
                    ]
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    falhas: { $push: { content: '$content', timestamp: '$timestamp' } },
                    titulo: { $first: '$titulo' },
                    totalFalhas: { $sum: 1 }
                }
            },
            {
                $match: {
                    totalFalhas: { $gte: 1 }
                }
            },
            { $sort: { totalFalhas: -1 } },
            { $limit: 10 }
        ]);

        // 4. MÉTRICAS GERAIS - Estatísticas Básicas
        console.log('📈 Coletando métricas gerais...');
        const metricasGerais = await SessaoChat.aggregate([
            {
                $facet: {
                    totalConversas: [{ $count: 'total' }],
                    totalMensagens: [
                        { $project: { count: { $size: { $ifNull: ['$messages', []] } } } },
                        { $group: { _id: null, total: { $sum: '$count' } } }
                    ],
                    ultimasConversas: [
                        { $sort: { startTime: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                sessionId: 1,
                                titulo: 1,
                                startTime: 1,
                                messages: { $size: { $ifNull: ['$messages', []] } }
                            }
                        }
                    ]
                }
            }
        ]);

        // Processar resultados
        const duracaoMedia = profundidadeEngajamento[0]?.duracaoMedia?.[0]?.media || 0;
        const distribuicao = profundidadeEngajamento[0]?.distribuicao || [];
        const conversasCurtas = distribuicao.find(d => d._id === 'curtas')?.count || 0;
        const conversasLongas = distribuicao.find(d => d._id === 'longas')?.count || 0;
        
        const totalConversas = metricasGerais[0]?.totalConversas?.[0]?.total || 0;
        const totalMensagens = metricasGerais[0]?.totalMensagens?.[0]?.total || 0;
        const ultimasConversas = metricasGerais[0]?.ultimasConversas || [];
        
        const respostasInconclusivas = analiseFalhas.reduce((acc, conv) => acc + conv.totalFalhas, 0);

        console.log('✅ Dashboard Estratégico montado com sucesso!');
        console.log(`📊 Métricas: ${totalConversas} conversas, ${totalMensagens} mensagens`);
        console.log(`🎯 Engajamento: ${duracaoMedia.toFixed(1)} mensagens/conversa em média`);
        console.log(`👥 Top usuários: ${lealdadeUsuario.length} identificados`);
        console.log(`🔍 Falhas detectadas: ${respostasInconclusivas} respostas inconclusivas`);

        res.json({
            mongoConnected: true,
            // Métricas básicas
            totalConversas,
            totalMensagens,
            ultimasConversas,
            // Profundidade de Engajamento
            duracaoMedia: Math.round(duracaoMedia * 10) / 10,
            conversasCurtas,
            conversasLongas,
            distribuicaoDetalhada: profundidadeEngajamento[0]?.distribuicaoDetalhada || [],
            // Lealdade do Usuário
            topUsuarios: lealdadeUsuario.map(user => ({
                userId: user.userId,
                totalSessoes: user.totalSessoes,
                totalMensagens: user.totalMensagens,
                ultimaAtividade: user.ultimaAtividade,
                tituloMaisRecente: user.tituloMaisRecente,
                engajamentoScore: Math.round(user.engajamentoScore * 10) / 10
            })),
            // Análise de Falhas
            conversasComFalha: analiseFalhas.map(conv => ({
                sessionId: conv._id,
                titulo: conv.titulo,
                totalFalhas: conv.totalFalhas,
                exemplosFalhas: conv.falhas.slice(0, 3) // Primeiras 3 falhas como exemplo
            })),
            respostasInconclusivas,
            // Metadados
            timestamp: new Date().toISOString(),
            versao: '2.0.0 - Sala de Guerra de Dados'
        });

    } catch (error) {
        console.error('❌ Erro no Dashboard Estratégico:', error);
        res.status(500).json({ 
            error: 'Erro ao obter dados do dashboard estratégico',
            details: error.message 
        });
    }
});

// GET /api/admin/system-instruction
app.get('/api/admin/system-instruction', requireAdmin, async (req, res) => {
    try {
        if (!isMongoConnected) return res.json({ instruction: '' });
        const cfg = await Configuracao.findOne({ chave: 'system_instruction' });
        res.json({ instruction: (cfg?.valor || '').toString() });
    } catch (error) {
        console.error('Erro ao ler system-instruction:', error);
        res.status(500).json({ error: 'Erro ao ler instrução' });
    }
});

// POST /api/admin/system-instruction
app.post('/api/admin/system-instruction', requireAdmin, async (req, res) => {
    try {
        const { instruction } = req.body || {};
        if (typeof instruction !== 'string' || !instruction.trim()) {
            return res.status(400).json({ error: 'Instrução inválida' });
        }
        if (!isMongoConnected) {
            return res.status(503).json({ error: 'MongoDB indisponível' });
        }
        const atualizado = await Configuracao.findOneAndUpdate(
            { chave: 'system_instruction' },
            { $set: { valor: instruction.trim(), atualizadoEm: new Date() } },
            { new: true, upsert: true }
        );
        res.json({ saved: true, instruction: atualizado.valor });
    } catch (error) {
        console.error('Erro ao salvar system-instruction:', error);
        res.status(500).json({ error: 'Erro ao salvar instrução' });
    }
});

// ========================
// Preferências do Usuário
// ========================

// GET /api/user/preferences - retorna a instrução personalizada
app.get('/api/user/preferences', requireUser, async (req, res) => {
    try {
        const { userId } = req;
        const usuario = await Usuario.findOne({ userId });
        res.json({ userId, systemInstruction: usuario?.systemInstruction || '' });
    } catch (error) {
        console.error('Erro ao obter preferências do usuário:', error);
        res.status(500).json({ error: 'Erro ao obter preferências' });
    }
});

// PUT /api/user/preferences - atualiza a instrução personalizada
app.put('/api/user/preferences', requireUser, async (req, res) => {
    try {
        const { userId } = req;
        const { systemInstruction } = req.body || {};
        if (typeof systemInstruction !== 'string') {
            return res.status(400).json({ error: 'systemInstruction inválida' });
        }
        const atualizado = await Usuario.findOneAndUpdate(
            { userId },
            { $set: { systemInstruction: systemInstruction.trim(), updatedAt: new Date() } },
            { new: true, upsert: true }
        );
        res.json({ saved: true, userId, systemInstruction: atualizado.systemInstruction });
    } catch (error) {
        console.error('Erro ao salvar preferências do usuário:', error);
        res.status(500).json({ error: 'Erro ao salvar preferências' });
    }
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
        const { message, history, sessionId: clientSessionId, userId: bodyUserId } = req.body;
        const headerUserId = req.headers['x-user-id'];
        const effectiveUserId = bodyUserId || headerUserId || null;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Mensagem não fornecida',
                details: 'Por favor, digite uma mensagem para que eu possa ajudá-lo.'
            });
        }

        // Gerar resposta do bot primeiro
        let botResponse;
        try {
            botResponse = await generateResponse(message, history, effectiveUserId);
        } catch (responseError) {
            console.error('Erro ao gerar resposta:', responseError);
            botResponse = 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
        }
        
        // Determinar o tipo de interação
        let tipo = 'geral';
        if (message.toLowerCase().includes('clima') || message.toLowerCase().includes('tempo')) {
            tipo = 'clima';
        } else if (message.toLowerCase().includes('horas') || message.toLowerCase().includes('hora atual')) {
            tipo = 'hora';
        } else if (message.toLowerCase().includes('história') || message.toLowerCase().includes('histórico')) {
            tipo = 'historico';
        }

        // Salvar a interação no histórico (coleção antiga) com melhor tratamento de erro
        try {
            const db = await connectDB();
            if (db) {
                const collection = db.collection('tb_chat_historico');
                await collection.insertOne({
                    data: new Date().toISOString().split('T')[0],
                    hora: new Date().toTimeString().split(' ')[0],
                    pergunta: message,
                    resposta: botResponse,
                    tipo: tipo,
                    timestamp: new Date()
                });
                console.log('Histórico do chat salvo com sucesso na coleção antiga');
            } else {
                console.log('MongoDB não disponível, pulando salvamento na coleção antiga');
            }
        } catch (error) {
            console.error('Erro ao salvar histórico do chat na coleção antiga:', error);
            // Não interrompe o fluxo se falhar ao salvar o histórico
        }

        // Salvar sessão de chat usando Mongoose (nova funcionalidade) com melhor tratamento de erro
        let sessionId = null;
        try {
            if (isMongoConnected) {
                // Usar sessionId do cliente quando fornecido, senão gerar um
                sessionId = clientSessionId && String(clientSessionId).trim()
                    ? String(clientSessionId).trim()
                    : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Criar ou atualizar sessão de chat com base no sessionId
                const sessaoExistente = await SessaoChat.findOne({ sessionId });

                if (sessaoExistente) {
                    // Adicionar mensagens à sessão existente
                    sessaoExistente.messages.push(
                        { role: 'user', content: message, timestamp: new Date() },
                        { role: 'assistant', content: botResponse, timestamp: new Date() }
                    );
                    await sessaoExistente.save();
                    console.log('Sessão de chat atualizada:', sessionId);
                } else {
                    // Criar nova sessão
                    const novaSessao = new SessaoChat({
                        sessionId: sessionId,
                        botId: 'Mari_Chatbot',
                        startTime: new Date(),
                        messages: [
                            { role: 'user', content: message, timestamp: new Date() },
                            { role: 'assistant', content: botResponse, timestamp: new Date() }
                        ]
                    });
                    await novaSessao.save();
                    console.log('Nova sessão de chat salva:', sessionId);
                }
            } else {
                console.log('MongoDB não conectado, usando fallback em memória');
            }
        } catch (error) {
            console.error('Erro ao salvar sessão de chat:', error);
            // Fallback: se Mongo falhar, usar memória
            console.log('Usando fallback em memória para sessão de chat');
        }

        // Fallback memória: se Mongo indisponível ou falhar, salvar/append na memória
        if (!isMongoConnected || !sessionId) {
            try {
                const mem = inMemorySessions.get(clientSessionId) || {
                    sessionId: clientSessionId || `session_${Date.now()}`,
                    botId: 'Mari_Chatbot',
                    startTime: new Date(),
                    messages: []
                };
                mem.messages.push(
                    { role: 'user', content: message, timestamp: new Date() },
                    { role: 'assistant', content: botResponse, timestamp: new Date() }
                );
                inMemorySessions.set(mem.sessionId, mem);
                sessionId = mem.sessionId;
                console.log('Sessão salva em memória:', sessionId);
            } catch (memoryError) {
                console.error('Erro ao salvar em memória:', memoryError);
                // Gerar um sessionId básico como último recurso
                sessionId = `fallback_${Date.now()}`;
            }
        }

        // Garantir que sempre temos um sessionId válido
        if (!sessionId) {
            sessionId = `emergency_${Date.now()}`;
        }

        const response = {
            response: botResponse,
            history: [...(history || []), 
                { role: 'user', content: message }, 
                { role: 'assistant', content: botResponse }
            ],
            sessionId: sessionId,
            userId: effectiveUserId || undefined,
            timestamp: new Date().toISOString()
        };

        console.log('Resposta enviada com sucesso, sessionId:', sessionId);
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

        // Mesmo com erro, tentar retornar uma resposta básica
        const fallbackResponse = {
            response: errorMessage,
            history: [...(req.body.history || []), 
                { role: 'user', content: req.body.message || 'Mensagem não fornecida' }, 
                { role: 'assistant', content: errorMessage }
            ],
            sessionId: req.body.sessionId || `error_${Date.now()}`,
            error: true,
            details: errorDetails,
            timestamp: new Date().toISOString()
        };

        res.status(500).json(fallbackResponse);
    }
});

// Endpoint para registrar logs de acesso
app.post('/api/log-connection', async (req, res) => {
    const { ip, acao, nomeBot } = req.body;
    const agora = new Date();
    const dataFormatada = agora.toISOString().split('T')[0];
    const horaFormatada = agora.toTimeString().split(' ')[0];

    // Sempre tenta registrar no banco do professor, mesmo com campos faltando
    await connectProfDB();
    if (isProfConnected && ProfLogAcesso) {
        const profLog = new ProfLogAcesso({
            col_data: dataFormatada,
            col_hora: horaFormatada,
            col_IP: ip || 'desconhecido',
            col_nome_bot: nomeBot || 'Mari_Chatbot',
            col_acao: acao || 'desconhecido'
        });
        try {
            await profLog.save();
            console.log('Log também registrado no banco do professor!');
        } catch (err) {
            console.warn('Não foi possível registrar log no banco do professor:', err);
        }
    } else {
        console.warn('Não foi possível conectar ao banco do professor.');
    }

    // Validação para o banco principal - agora mais flexível
    if (!ip || !acao) {
        return res.status(400).json({ 
            error: "Dados de log incompletos (IP e ação são obrigatórios)." 
        });
    } else {
        console.log('Dados de log recebidos:', req.body);
    }

    try {
        const novoLog = new LogAcesso({
            col_data: dataFormatada,
            col_hora: horaFormatada,
            col_IP: ip,
            col_nome_bot: nomeBot || 'Mari_Chatbot',
            col_acao: acao
        });
        await novoLog.save();
        console.log('Log registrado com sucesso Mari_Chatbot:', novoLog);
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
        nomeBot: "Mari_Chatbot",
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

// Endpoint para buscar histórico do chat (usando driver nativo)
app.get('/api/chat/historico', async (req, res) => {
    try {
        const { data, tipo, limit = 50 } = req.query;
        
        const query = {};
        if (data) query.data = data;
        if (tipo) query.tipo = tipo;

        const db = await connectDB();
        if (!db) {
            return res.status(503).json({ 
                error: 'Servidor não conectado ao banco de dados',
                message: 'Adicione seu IP à whitelist do MongoDB Atlas'
            });
        }
        
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

// Endpoint para buscar históricos de conversas (usando Mongoose)
app.get('/api/chat/historicos', async (req, res) => {
    try {
        // Tentar conectar se não estiver conectado
        if (!isMongoConnected) {
            try {
                await connectDB();
            } catch (connectError) {
                console.log('Tentativa de conexão falhou:', connectError.message);
            }
        }

        if (!isMongoConnected) {
            // Fallback: retornar sessões em memória
            const memoria = Array.from(inMemorySessions.values())
                .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
                .slice(0, 10);
            console.log(`[Servidor] Retornando ${memoria.length} históricos em memória (MongoDB não disponível)`);
            return res.json(memoria);
        }

        // Busca todas as sessões, ordena pelas mais recentes, limita a 10
        const historicos = await SessaoChat.find({})
                                          .sort({ startTime: -1 }) // -1 para ordem decrescente (mais recentes primeiro)
                                          .limit(10); // Limita a 10 resultados para não sobrecarregar
        
        console.log(`[Servidor] Buscados ${historicos.length} históricos de conversas`);
        res.json(historicos);

    } catch (error) {
        console.error("[Servidor] Erro ao buscar históricos:", error);
        res.status(500).json({ 
            error: "Erro interno ao buscar históricos de chat.",
            details: error.message 
        });
    }
});

// DELETE /api/chat/historicos/:id - excluir histórico de sessão por _id
app.delete('/api/chat/historicos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Servidor não conectado ao MongoDB',
                message: 'Adicione seu IP à whitelist do MongoDB Atlas'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID inválido.' });
        }

        const removida = await SessaoChat.findByIdAndDelete(id);
        if (!removida) {
            return res.status(404).json({ error: 'Histórico não encontrado.' });
        }

        return res.status(200).json({ message: 'Histórico excluído com sucesso.' });
    } catch (error) {
        console.error('[Servidor] Erro ao excluir histórico:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'ID inválido.' });
        }
        return res.status(500).json({ error: 'Erro interno ao excluir histórico.' });
    }
});

// POST /api/chat/historicos/:id/gerar-titulo - obter sugestão de título via Gemini
app.post('/api/chat/historicos/:id/gerar-titulo', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Servidor não conectado ao MongoDB',
                message: 'Adicione seu IP à whitelist do MongoDB Atlas'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID inválido.' });
        }

        const sessao = await SessaoChat.findById(id);
        if (!sessao) {
            return res.status(404).json({ error: 'Histórico não encontrado.' });
        }

        const mensagens = Array.isArray(sessao.messages) ? sessao.messages : [];
        const historicoFormatado = mensagens
            .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
            .join('\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = [
            'Considere a conversa abaixo e sugira um título curto, conciso e claro (máximo 5 palavras).',
            'Responda com APENAS o título, sem aspas, sem ponto final.',
            '',
            'Conversa:',
            historicoFormatado
        ].join('\n');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let tituloSugerido = '';

        if (typeof response.text === 'function') {
            tituloSugerido = (response.text() || '').trim();
        } else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            tituloSugerido = (response.candidates[0].content.parts[0].text || '').trim();
        }

        // Sanitização básica: remover aspas e limitar a 5 palavras
        tituloSugerido = tituloSugerido.replace(/^"|"$/g, '').replace(/[\n\r]/g, ' ').trim();
        const palavras = tituloSugerido.split(/\s+/).filter(Boolean);
        if (palavras.length > 5) {
            tituloSugerido = palavras.slice(0, 5).join(' ');
        }

        if (!tituloSugerido) {
            tituloSugerido = 'Conversa Sem Título';
        }

        return res.status(200).json({ tituloSugerido });
    } catch (error) {
        console.error('[Servidor] Erro ao gerar título:', error);
        return res.status(500).json({ error: 'Erro ao gerar título com a API Gemini.' });
    }
});

// PUT /api/chat/historicos/:id - atualizar título
app.put('/api/chat/historicos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo } = req.body || {};

        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Servidor não conectado ao MongoDB',
                message: 'Adicione seu IP à whitelist do MongoDB Atlas'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID inválido.' });
        }

        if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
            return res.status(400).json({ error: 'Título inválido.' });
        }

        const atualizado = await SessaoChat.findByIdAndUpdate(
            id,
            { $set: { titulo: titulo.trim() } },
            { new: true }
        );

        if (!atualizado) {
            return res.status(404).json({ error: 'Histórico não encontrado.' });
        }

        return res.status(200).json(atualizado);
    } catch (error) {
        console.error('[Servidor] Erro ao atualizar título:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'ID inválido.' });
        }
        return res.status(500).json({ error: 'Erro interno ao atualizar título.' });
    }
});
// PUT /api/chat/historicos/session/:sessionId - atualizar título por sessionId (útil para fallback/memória)
app.put('/api/chat/historicos/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { titulo } = req.body || {};

        if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
            return res.status(400).json({ error: 'Título inválido.' });
        }

        if (isMongoConnected) {
            const atualizado = await SessaoChat.findOneAndUpdate(
                { sessionId },
                { $set: { titulo: titulo.trim() } },
                { new: true }
            );
            if (!atualizado) return res.status(404).json({ error: 'Histórico não encontrado.' });
            return res.status(200).json(atualizado);
        }

        // Fallback memória
        const mem = inMemorySessions.get(sessionId);
        if (!mem) return res.status(404).json({ error: 'Histórico não encontrado.' });
        mem.titulo = titulo.trim();
        inMemorySessions.set(sessionId, mem);
        return res.status(200).json(mem);
    } catch (error) {
        console.error('[Servidor] Erro ao atualizar título por sessionId:', error);
        return res.status(500).json({ error: 'Erro interno ao atualizar título.' });
    }
});

// Endpoint para buscar detalhes de uma sessão específica
app.get('/api/chat/historicos/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Servidor não conectado ao MongoDB',
                message: 'Adicione seu IP à whitelist do MongoDB Atlas'
            });
        }

        const sessao = await SessaoChat.findOne({ sessionId: sessionId });
        
        if (!sessao) {
            return res.status(404).json({ error: "Sessão não encontrada." });
        }

        res.json(sessao);

    } catch (error) {
        console.error("[Servidor] Erro ao buscar sessão específica:", error);
        res.status(500).json({ error: "Erro interno ao buscar sessão." });
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
            console.log('Tentando conectar ao MongoDB...');
            await connectDB();
        }
        
        const status = {
            status: 'success',
            message: 'Conexão com MongoDB estabelecida',
            isConnected: isMongoConnected,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            mongoUri: process.env.MONGO_URI_mari ? 'Configurada' : 'Não configurada',
            googleApi: process.env.GOOGLE_API_KEY ? 'Configurada' : 'Não configurada'
        };
        
        res.json(status);
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Erro ao conectar com MongoDB',
            error: error.message,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    }
});

// Endpoint para testar funcionalidades específicas
app.get('/test-functions', async (req, res) => {
    try {
        const tests = {
            mongodb: {
                connected: isMongoConnected,
                collections: []
            },
            apis: {
                google: !!process.env.GOOGLE_API_KEY,
                openweather: !!process.env.OPENWEATHER_API_KEY
            },
            memory: {
                sessions: inMemorySessions.size
            }
        };
        
        // Testar MongoDB se conectado
        if (isMongoConnected) {
            try {
                const db = mongoose.connection.db;
                const collections = await db.listCollections().toArray();
                tests.mongodb.collections = collections.map(c => c.name);
            } catch (mongoError) {
                tests.mongodb.error = mongoError.message;
            }
        }
        
        res.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            tests: tests
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erro ao executar testes',
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
        if (!process.env.MONGO_URI_mari) {
            throw new Error('MONGO_URI_mari não está definida no arquivo .env');
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

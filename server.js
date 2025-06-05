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
            // Extrair a localização da mensagem (exemplo simples)
            const locationMatch = message.match(/em\s+([^,.]+)/i);
            const location = locationMatch ? locationMatch[1].trim() : 'Curitiba, BR';
            console.log('Localização extraída:', location);
            
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
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Mensagem não fornecida',
                details: 'Por favor, digite uma mensagem para que eu possa ajudá-lo.'
            });
        }

        const botResponse = await generateResponse(message, history);
        
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

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Chave API configurada:', process.env.GOOGLE_API_KEY ? 'Sim' : 'Não');
}); 

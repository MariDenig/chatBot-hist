import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import cors from 'cors';

const app = express();

// Configuração do CORS para permitir todas as origens
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Configuração do Gemini
const genAI = new GoogleGenerativeAI("AIzaSyAoy3uazke_0KGp3iBIHmE8fRODK2PQpTA");

async function run(prompt, history = []) {
  try {
    console.log('Recebida pergunta:', prompt);
    
    const model = genAI.getModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        stopSequences: [],
        maxOutputTokens: 1000,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    });

    // Construir o histórico da conversa
    const chatHistory = [
      {
        role: "user",
        parts: "Você é um especialista em história com conhecimento profundo sobre história do Brasil, história mundial, guerras, civilizações antigas e períodos históricos importantes. Sua função é fornecer respostas detalhadas, precisas e envolventes, sempre mantendo um tom educacional e acessível. Você pode usar analogias, exemplos e contextos para tornar as explicações mais claras e interessantes.",
      },
      {
        role: "model",
        parts: "Entendido! Sou um especialista em história dedicado a fornecer explicações detalhadas e envolventes. Vou usar meu conhecimento para responder suas perguntas de forma clara, precisa e interessante, sempre mantendo um tom educacional e acessível.",
      },
      ...history.map(msg => ({
        role: msg.role,
        parts: msg.content
      }))
    ];

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        stopSequences: [],
        maxOutputTokens: 1000,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    console.log('Resposta gerada:', response.text());
    return response.text();
  } catch (error) {
    console.error('Erro ao processar a pergunta:', error);
    throw new Error('Erro ao processar sua pergunta. Por favor, tente novamente.');
  }
}

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor está funcionando!' });
});

app.post('/chat', async (req, res) => {
  try {
    console.log('Recebida requisição POST em /chat');
    const { message, history } = req.body;
    
    if (!message) {
      console.log('Mensagem não fornecida');
      return res.status(400).json({ error: 'Mensagem não fornecida' });
    }
    
    console.log('Processando mensagem:', message);
    const response = await run(message, history);
    console.log('Enviando resposta para o cliente');
    res.json({ response });
  } catch (error) {
    console.error('Erro no endpoint /chat:', error);
    res.status(500).json({ error: error.message || 'Ocorreu um erro ao processar sua mensagem' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para testar o chatbot`);
  console.log('Teste a conexão acessando: http://localhost:3001/test');
  console.log('Acesse a interface do chatbot em: http://localhost:8080/index.html');
}); 
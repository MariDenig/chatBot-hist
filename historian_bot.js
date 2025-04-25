require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Erro: Chave de API do Google não encontrada. Verifique seu arquivo .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "Você é um chatbot historiador. Responda às perguntas dos usuários de forma informativa, precisa e envolvente, sempre com uma perspectiva histórica. Cite fontes ou períodos relevantes quando apropriado. Aja como um especialista apaixonado por história.",
});

async function askHistorian(question) {
    try {
        console.log("\nHistoriador está pensando...")

        const chat = model.startChat({
            history: [],
            generationConfig: {
                temperature: 0.7,
            }
        });

        const result = await chat.sendMessage(question);
        const response = await result.response;
        const text = response.text();

        return text;

    } catch (error) {
        console.error("Erro ao contatar o historiador (API):", error);
        return "Desculpe, ocorreu um erro ao processar sua pergunta histórica.";
    }
}

function startChat() {
    readline.question("Faça sua pergunta ao historiador (ou digite 'sair' para terminar): ", async (userQuestion) => {
        if (userQuestion.toLowerCase() === 'sair') {
            console.log("Até a próxima viagem pela história!");
            readline.close();
            return;
        }

        const historianResponse = await askHistorian(userQuestion);
        console.log("\n--- Resposta do Historiador ---");
        console.log(historianResponse);
        console.log("----------------------------\n");

        startChat();
    });
}

console.log("Bem-vindo ao Chatbot Historiador!");
console.log("Conectando com a API do Google Generative AI...");
startChat(); 
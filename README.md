# Chatbot Historiador · Assistente Gemini IFPR

> **Slogan:** “Seu historiador pessoal com memória, métricas e um toque de criatividade.”

[![Status](https://img.shields.io/badge/status-Demo%20Day%20Ready-ff69b4.svg)](#) [![Node](https://img.shields.io/badge/Node.js-18+-77b300?logo=node.js&logoColor=white)](#) [![Express](https://img.shields.io/badge/Express.js-4.x-000?logo=express&logoColor=white)](#) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-116149?logo=mongodb&logoColor=white)](#) [![Gemini](https://img.shields.io/badge/Google%20Gemini-API%202.0-4285F4?logo=google&logoColor=white)](#)

---

## 👀 Demonstração Rápida

![Fluxo completo do Chatbot Historiador](https://placehold.co/1200x675/fbe5f2/ff69b4?text=Grave+seu+GIF+do+Chatbot+Historiador)

> 💡 *Assim que gravar o GIF (login ➜ pergunta histórica ➜ personalização), salve-o em `docs/demo-day.gif` e troque o link acima para exibir a sua própria demo no GitHub.*

### Fluxo destacado
1. Login e validação visual do status do servidor.
2. Conversa assistida com comandos especiais para hora e clima.
3. Salvamento automático da sessão + edição de título com IA.
4. Painel administrativo com métricas de engajamento (“Sala de Guerra de Dados”).

---

## ✨ Principais Funcionalidades

- **Chat histórico com Gemini 2.5 Flash** ajustável por usuário ou instrução global.
- **Ferramentas rápidas**: clima com fallback inteligente, consulta de horário e detectores de intenção.
- **Histórico completo**: geração de títulos via IA, edição inline, exclusão segura e visualização detalhada.
- **Dashboard inteligente**: métricas de engajamento, falhas, usuários VIP e comparação de conversas curtas x longas.
- **Monitoramento e logs**: registro automático de acessos, ranking do bot e dupla redundância de banco (Atlas + banco do professor).
- **Experiência refinada**: indicador de status, onboarding contextual, placeholders guiados e modais responsivos.

---

## 🧱 Tech Stack (com logos)

<p align="left">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-HTML5%20·%20CSS3%20·%20JS-ff69b4?logo=html5&logoColor=white" />
  <img alt="Backend" src="https://img.shields.io/badge/Backend-Node.js%20·%20Express-68a063?logo=node.js&logoColor=white" />
  <img alt="Banco" src="https://img.shields.io/badge/Database-MongoDB%20Atlas-116149?logo=mongodb&logoColor=white" />
  <img alt="IA" src="https://img.shields.io/badge/IA-Google%20Gemini%202.5-4285F4?logo=google&logoColor=white" />
  <img alt="Clima" src="https://img.shields.io/badge/Clima-OpenWeather-ff9f1c?logo=icloud&logoColor=white" />
  <img alt="Hospedagem" src="https://img.shields.io/badge/Hosting-Render%20·%20Vercel-000?logo=vercel&logoColor=white" />
</p>

---

## 🔗 Links para a Demo

- **Frontend (Vercel):** https://chat-bot-hist.vercel.app  
- **Backend (Render):** https://chatbot-historia.onrender.com  
- **Painel Administrativo:** https://chatbot-historia.onrender.com/admin (requer `ADMIN_SECRET`)

---

## 🧭 Arquitetura em Três Camadas

```
Usuário → Frontend estático (Vercel) → API Express (Render) → MongoDB Atlas
                                       ↘️ Logs redundantes para banco do professor
```

- **Fallbacks inteligentes:** se o Mongo ficar indisponível, as sessões continuam em memória e são sincronizadas depois.
- **Ferramentas Gemini:** funções `getCurrentTime`, `getWeather` e `searchHistory` acrescentadas ao modelo para respostas pragmáticas.
- **Sala de Guerra de Dados:** agregações MongoDB entregam métricas avançadas em `/api/admin/dashboard`.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- MongoDB Atlas (ou local)
- Chaves das APIs Gemini e OpenWeather

### Passo a passo
```bash
# 1. Clonar
git clone https://github.com/<seu-usuario>/chatBot-hist.git
cd chatBot-hist

# 2. Instalar dependências
npm install

# 3. Configurar variáveis
cp .env.example .env   # ou crie manualmente

# 4. Rodar em modo dev
npm run dev            # nodemon + reload

# 5. Rodar em produção
npm start
```

### Variáveis de ambiente (`.env`)
```
MONGO_URI_mari=mongodb+srv://<usuario>:<senha>@cluster.mongodb.net/<db>?retryWrites=true&w=majority
MONGO_URI_prof=mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
GOOGLE_API_KEY=sua_chave_gemini
OPENWEATHER_API_KEY=sua_chave_openweather
PORT=3001
NODE_ENV=production
ADMIN_SECRET=defina-uma-senha-segura
```

---

## 🧪 QA Checklist para o Demo Day

| Etapa | O que validar |
| --- | --- |
| Fluxo novo usuário | Onboarding aparece apenas na primeira visita e some após interação |
| Conversa | Perguntas históricas, clima (“Como está o tempo em Curitiba?”) e hora (“Que horas são?”) |
| Histórico | Abrir modal, gerar título com IA, editar manualmente, excluir registro |
| Painel Admin | `/admin` exibe métricas quando `x-admin-secret` é enviado |
| Logs & Ranking | Endpoint `/api/log-connection` grava IPs válidos, ranking incrementa acessos |
| Fallbacks | Simular ausência de Mongo (desligar internet) e confirmar que o chat continua com sessão em memória |

> Execute `npm run dev`, abra duas abas (chat + admin) e valide cada linha acima para garantir zero surpresas no Demo Day.

---

## 🗣️ Roteiro de Pitch (3 minutos)

1. **A ideia (30s)**  
   “Criamos o Chatbot Historiador, um bot tematizado em história com personalidade configurável para cada aluno do IFPR.”

2. **Demonstração (90s)**  
   - Mostre o status online e o onboarding.  
   - Faça uma pergunta histórica + comando de clima.  
   - Abra o histórico, gere um título com IA e personalize o bot no painel de configurações.  
   - Se houver tempo, abra rapidamente o painel admin com as métricas coletadas.

3. **Desafio & aprendizado (60s)**  
   “Nosso maior desafio foi manter logs e sessões mesmo quando o Mongo caía. Resolvemos com reconexão automática, fallback em memória e dashboards de monitoramento. Aprendemos a combinar segurança, UX e IA em um produto completo.”

Feche convidando a banca a testar no link público.

---

## 🧰 Troubleshooting Rápido

- **Histórico não salva:** verifique `/test-mongo`, whitelist do Atlas e logs do Render.  
- **Geração de título falha:** confirme `GOOGLE_API_KEY`, observe o console do servidor e tente novamente após 30s (há retry com timeout).  
- **Erro ao editar título:** use o fallback por `sessionId` (`/api/chat/historicos/session/:sessionId`).  
- **Clima indisponível:** cheque `OPENWEATHER_API_KEY` e se a cidade inclui “, BR”.  
- **Servidor em produção caiu:** rode `test-hospedagem.js` para validar portas, variáveis e latência.

---

## 📁 Estrutura do Projeto

```
chatBot-hist/
├── index.html / style.css / client.js   # UI principal (Vercel)
├── configuracoes.html / .js             # Painel de personalização por usuário
├── admin.html / admin.js                # Sala de Guerra de Dados
├── server.js                            # API Express + Gemini + Mongo
├── models/                              # Schemas Mongoose (SessaoChat, Usuario, Configuracao)
├── test-hospedagem.js / test-env.js     # Scripts de QA
└── docs/demo-day.gif                    # GIF da apresentação (adicione o seu)
```

---

## 📊 Métricas Guiadas por Dados

- **Profundidade de engajamento:** bucketização automática por quantidade de mensagens (curtas x longas).  
- **Usuários VIP:** ranking por score (sessões + mensagens) com medalhas 🥇🥈🥉.  
- **Análise de falhas:** regex para respostas inconclusivas e histórico com timestamp.  
- **Ciclo de melhoria contínua:** medir ➜ analisar ➜ agir ➜ repetir (detalhado em `PAINEL_ADMIN.md`).

Próximos passos sugeridos: recomendações por tópico, análise de sentimento em tempo real, alertas proativos e personalização automática por perfil.

---

## 👩‍💻 Autora

**Mariani Denig**  
- Email: [marianileme10@gmail.com](mailto:marianileme10@gmail.com)  
- Instagram: [@mari.denig](https://www.instagram.com/mari.denig/)  

Projeto desenvolvido no IFPR como peça final de portfólio para o Demo Day 2025. Guardamos com carinho – ele prova que conseguimos levar uma ideia de IA do conceito à produção. 💜
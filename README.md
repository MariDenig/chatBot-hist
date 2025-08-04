# Chatbot Historiador - B3.P1.A2

## 📋 Descrição do Projeto

Este é um chatbot inteligente desenvolvido para responder perguntas sobre história, utilizando a API Gemini da Google. O projeto implementa funcionalidades avançadas de persistência de dados e histórico de conversas.

## 🚀 Funcionalidades Implementadas

### ✅ B3.P1.A2 - Memórias de um Chatbot: Lendo e Exibindo Históricos de Conversa

- **Endpoint GET `/api/chat/historicos`**: Busca todas as sessões de chat salvas no MongoDB
- **Endpoint GET `/api/chat/historicos/:sessionId`**: Busca detalhes de uma sessão específica
- **Interface de Histórico**: Modal com lista de conversas e visualização detalhada
- **Persistência de Dados**: Salva automaticamente cada conversa no MongoDB Atlas
- **Ordenação**: Históricos ordenados por data (mais recentes primeiro)
- **Limitação**: Máximo de 10 resultados para performance

### ✅ Funcionalidades Anteriores

- **Chat Inteligente**: Respostas baseadas em IA usando Google Gemini
- **Verificação de Horário**: Função para obter hora atual
- **Previsão do Tempo**: Integração com OpenWeather API
- **Logs de Acesso**: Registro de todas as interações
- **Ranking de Bots**: Sistema de pontuação e ranking
- **Interface Responsiva**: Design moderno e adaptável

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: MongoDB Atlas com Mongoose
- **IA**: Google Gemini API
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs Externas**: OpenWeather API
- **Deploy**: Render (Backend)

## 📁 Estrutura do Projeto

```
chatBot-hist/
├── server.js              # Servidor principal
├── models/
│   └── SessaoChat.js     # Modelo Mongoose para sessões
├── client.js              # JavaScript do frontend
├── index.html             # Interface principal
├── style.css              # Estilos CSS
├── package.json           # Dependências
├── .env                   # Variáveis de ambiente
└── README.md              # Documentação
```

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- Conta no MongoDB Atlas
- Chave da API Google Gemini
- Chave da API OpenWeather

### Instalação

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd chatBot-hist
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
GOOGLE_API_KEY=sua_chave_api_gemini
OPENWEATHER_API_KEY=sua_chave_api_openweather
MONGO_URI_mari=sua_uri_mongodb_atlas
MONGO_URI_prof=uri_banco_professor
PORT=3000
```

4. **Configure o MongoDB Atlas**
- Acesse o MongoDB Atlas
- Adicione seu IP à whitelist
- Configure a URI de conexão

5. **Execute o servidor**
```bash
npm start
```

## 📡 Endpoints da API

### Chat e Histórico
- `POST /chat` - Envia mensagem para o chatbot
- `GET /api/chat/historicos` - Lista todas as sessões de chat
- `GET /api/chat/historicos/:sessionId` - Detalhes de uma sessão específica

### Logs e Monitoramento
- `POST /api/log-connection` - Registra logs de acesso
- `GET /api/logs` - Visualiza logs de acesso
- `GET /api/ranking/visualizar` - Visualiza ranking de bots

### Status e Testes
- `GET /status` - Status do servidor e APIs
- `GET /test-mongo` - Testa conexão com MongoDB

## 🎯 Como Usar

1. **Acesse a aplicação**: http://localhost:3000
2. **Faça perguntas**: Digite suas dúvidas sobre história
3. **Use os botões especiais**:
   - ⏰ **Relógio**: Verificar hora atual
   - ☀️ **Clima**: Consultar previsão do tempo
   - 📚 **Histórico**: Ver conversas anteriores

4. **Visualize o histórico**:
   - Clique no botão de histórico
   - Veja a lista de conversas salvas
   - Clique em uma conversa para ver os detalhes

## 🔍 Funcionalidades do Histórico

### Interface do Histórico
- **Lista de Sessões**: Mostra data, hora e número de mensagens
- **Visualização Detalhada**: Exibe conversa completa com timestamps
- **Design Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Estados de Carregamento**: Feedback visual durante operações

### Persistência de Dados
- **Salvamento Automático**: Cada conversa é salva automaticamente
- **Estrutura Organizada**: Dados estruturados com sessionId, botId, timestamps
- **Recuperação Robusta**: Sistema tolerante a falhas de conexão

## 🚨 Solução de Problemas

### Erro de Conexão com MongoDB
```
Erro: Could not connect to any servers in your MongoDB Atlas cluster
```
**Solução**: Adicione seu IP à whitelist do MongoDB Atlas

### Erro 400 no Log
```
Erro: Dados de log incompletos
```
**Solução**: Verifique se o endpoint `/api/log-connection` está recebendo os dados corretos

### Histórico Vazio
```
Nenhuma conversa salva ainda
```
**Solução**: Faça algumas conversas primeiro para gerar dados

## 📊 Estrutura dos Dados

### Modelo SessaoChat
```javascript
{
  sessionId: String,        // ID único da sessão
  botId: String,           // Nome do bot
  startTime: Date,         // Início da conversa
  endTime: Date,           // Fim da conversa (opcional)
  messages: [              // Array de mensagens
    {
      role: String,        // 'user' ou 'assistant'
      content: String,     // Conteúdo da mensagem
      timestamp: Date      // Horário da mensagem
    }
  ],
  loggedAt: Date           // Data de registro
}
```

## 🎨 Interface do Usuário

### Características do Design
- **Cores**: Azul (#1976d2) e verde (#4caf50) para diferenciação
- **Tipografia**: Fonte legível e hierarquia clara
- **Animações**: Transições suaves e feedback visual
- **Responsividade**: Adaptação para mobile e desktop

### Componentes Principais
- **Chat Container**: Área principal de conversa
- **Modal de Histórico**: Lista e visualização de conversas
- **Botões de Ação**: Acesso rápido a funcionalidades
- **Indicador de Digitação**: Feedback durante processamento

## 🔐 Segurança

- **Validação de Entrada**: Verificação de dados antes do processamento
- **Tratamento de Erros**: Captura e tratamento adequado de exceções
- **Logs Seguros**: Registro de atividades sem exposição de dados sensíveis
- **CORS Configurado**: Controle de acesso cross-origin

## 📈 Melhorias Futuras

- [ ] Paginação no histórico
- [ ] Filtros por data/bot
- [ ] Exportação de conversas
- [ ] Sistema de busca no histórico
- [ ] Notificações em tempo real
- [ ] Autenticação de usuários

## 👨‍💻 Autora

**Mariani Denig**
- Email: marianileme10@gmail.com
- Instagram: [@mari.denig](https://www.instagram.com/mari.denig/)
- Projeto desenvolvido para o IFPR

## 📄 Licença

Este projeto foi desenvolvido como parte do curso de desenvolvimento web no IFPR.

---

**Status do Projeto**: ✅ Completo - B3.P1.A2 implementado com sucesso! 
# Chatbot Historiador

Um chatbot especializado em história, utilizando a API Gemini da Google para fornecer respostas informativas e precisas sobre tópicos históricos.

## Recursos

- Interface de chat amigável
- Respostas precisas sobre eventos históricos
- Consulta à hora atual
- Consulta à previsão do tempo (requer API key do OpenWeatherMap)
- Histórico de conversas

## Estrutura do Projeto

```
chatBot-hist/
├── public/               # Arquivos do cliente
│   ├── index.html        # Página principal
│   ├── style.css         # Estilos
│   └── client.js         # Lógica do cliente
├── server.js             # Servidor Express
├── package.json          # Dependências
└── .env                  # Variáveis de ambiente (criar manualmente)
```

## Requisitos

- Node.js 14.x ou superior
- Chave de API do Google Gemini
- Chave de API do OpenWeatherMap (opcional, para recurso de clima)

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```
   GOOGLE_API_KEY=sua_chave_api_aqui
   OPENWEATHER_API_KEY=sua_chave_openweather_aqui
   NODE_ENV=development
   ```
4. Inicie o servidor:
   ```
   npm start
   ```
   Ou para desenvolvimento:
   ```
   npm run dev
   ```
5. Acesse `http://localhost:3000` no navegador

## Como Obter Chaves de API

### Google Gemini API
1. Acesse https://ai.google.dev/
2. Crie uma conta ou faça login
3. Crie um projeto e obtenha uma chave de API

### OpenWeatherMap API (opcional)
1. Acesse https://openweathermap.org/
2. Crie uma conta gratuita
3. Navegue até a seção de chaves de API
4. Crie uma nova chave de API

## Licença

Este projeto está licenciado sob a licença MIT. 
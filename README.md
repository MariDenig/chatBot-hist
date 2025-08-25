# Chatbot Historiador - Mari

Um chatbot inteligente especializado em história, desenvolvido com Node.js, Express e Google Gemini AI.

## 🚀 Funcionalidades

- **Chat Inteligente**: Respostas baseadas em IA usando Google Gemini
- **Previsão do Tempo**: Integração com OpenWeatherMap API
- **Data e Hora**: Hora atual em fuso horário brasileiro
- **Histórico de Conversas**: Armazenamento em MongoDB
- **Interface Responsiva**: Design moderno e intuitivo

## ⚡ Problemas Corrigidos

### ✅ Data e Hora Corretas
- Implementado fuso horário brasileiro (UTC-3)
- Formatação adequada para o padrão brasileiro
- Sincronização com servidor local

### ✅ Temperatura Precisa
- Integração otimizada com OpenWeatherMap
- Conversão de timestamp para hora local brasileira
- Tratamento de erros e timeouts
- Informações atualizadas em tempo real

### ✅ Performance Melhorada
- Timeout de 30 segundos para respostas da IA
- Timeout de 10 segundos para API de clima
- Indicadores visuais de progresso
- Cache e otimizações de resposta

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd chatBot-hist
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp config.example .env

# Edite o arquivo .env com suas chaves
nano .env
```

4. **Configure as APIs necessárias**

### Google Gemini API (Obrigatória)
- Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
- Crie uma nova chave API
- Adicione no arquivo `.env`:
```
GOOGLE_API_KEY=sua_chave_aqui
```

### OpenWeatherMap API (Opcional)
- Acesse [OpenWeatherMap](https://openweathermap.org/api)
- Crie uma conta gratuita
- Obtenha sua chave API
- Adicione no arquivo `.env`:
```
OPENWEATHER_API_KEY=sua_chave_aqui
```

### MongoDB (Obrigatório)
- Configure sua conexão MongoDB Atlas
- Adicione no arquivo `.env`:
```
MONGO_URI_mari=mongodb+srv://usuario:senha@cluster.mongodb.net/banco
```

5. **Inicie o servidor**
```bash
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# APIs (obrigatórias)
GOOGLE_API_KEY=sua_chave_google
MONGO_URI_mari=sua_uri_mongodb

# APIs (opcionais)
OPENWEATHER_API_KEY=sua_chave_openweather
MONGO_URI_prof=uri_mongodb_professor

# Configurações do servidor
NODE_ENV=development
PORT=3001
```

## 📱 Uso

1. **Acesse o chatbot** em `http://localhost:3001`
2. **Faça perguntas sobre história** - o bot responderá usando IA
3. **Verifique o clima** - clique no botão de clima e digite uma cidade
4. **Veja a hora atual** - clique no botão de relógio
5. **Acesse o histórico** - clique no botão de histórico

## 🎯 Comandos Especiais

- **"Que horas são?"** - Mostra a hora atual em fuso brasileiro
- **"Como está o tempo em [cidade]?"** - Previsão do tempo para uma cidade
- **Perguntas sobre história** - Respostas detalhadas via IA

## 🚨 Solução de Problemas

### Chatbot não responde
- Verifique se `GOOGLE_API_KEY` está configurada
- Confirme se o servidor está rodando
- Verifique os logs do console

### Data/hora incorretas
- ✅ **Corrigido**: Implementado fuso horário brasileiro
- O sistema agora usa UTC-3 automaticamente

### Temperatura incorreta
- ✅ **Corrigido**: Sincronização com fuso horário local
- Adicionado timestamp de atualização
- Timeout para evitar respostas lentas

### Respostas lentas
- ✅ **Corrigido**: Implementado sistema de timeout
- Indicadores visuais de progresso
- Otimizações de performance

### Erro de conexão MongoDB
- Verifique se `MONGO_URI_mari` está correto
- Confirme se seu IP está na whitelist do MongoDB Atlas
- O servidor continuará funcionando sem MongoDB (funcionalidades limitadas)

## 📊 Monitoramento

- **Logs de acesso** em `/api/logs`
- **Status do servidor** em `/status`
- **Histórico de conversas** em `/api/chat/historicos`
- **Teste de conexão MongoDB** em `/test-mongo`

## 🔄 Atualizações Recentes

- ✅ Correção do fuso horário brasileiro
- ✅ Otimização da API de clima
- ✅ Sistema de timeout para melhor performance
- ✅ Indicadores visuais de progresso
- ✅ Tratamento robusto de erros

## 📝 Licença

Este projeto é desenvolvido para fins educacionais.

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do console
2. Confirme as configurações no arquivo `.env`
3. Teste as APIs individualmente
4. Abra uma issue no repositório
# Configuração para Hospedagem

## Problemas Identificados e Soluções

### 1. Falhas ao Salvar Histórico na Hospedagem

**Causa:** Problemas de conexão com MongoDB na hospedagem

**Soluções Implementadas:**
- Timeouts configurados para conexões MongoDB
- Reconexão automática em caso de falha
- Fallback para armazenamento em memória
- Melhor tratamento de erros

**Configuração Necessária:**
```bash
# No arquivo .env da hospedagem
MONGO_URI_mari=mongodb+srv://seu_usuario:sua_senha@seu_cluster.mongodb.net/seu_banco?retryWrites=true&w=majority
GOOGLE_API_KEY=sua_chave_api_do_google_gemini
```

**Verificações:**
1. IP da hospedagem adicionado à whitelist do MongoDB Atlas
2. String de conexão correta
3. Usuário e senha válidos
4. Rede da hospedagem permite conexões MongoDB (porta 27017)

### 2. Função de Modificar Título Não Funcionando

**Causa:** Problemas de conectividade e tratamento de erros

**Soluções Implementadas:**
- Melhor tratamento de erros no frontend
- Fallback para atualização via sessionId
- Validação de dados antes de enviar
- Logs detalhados para debug

**Como Funciona Agora:**
1. Tenta atualizar via MongoDB primeiro
2. Se falhar, usa fallback via sessionId
3. Atualiza UI imediatamente
4. Mostra mensagens de erro claras

## Configuração Completa

### Variáveis de Ambiente (.env)
```bash
# MongoDB
MONGO_URI_mari=mongodb+srv://usuario:senha@cluster.mongodb.net/banco?retryWrites=true&w=majority
MONGO_URI_prof=mongodb+srv://user_log_acess:Log4c3ss2025@cluster0.nbt3sks.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# APIs
GOOGLE_API_KEY=sua_chave_gemini
OPENWEATHER_API_KEY=sua_chave_openweather

# Servidor
PORT=3001
NODE_ENV=production
```

### Verificações de Conectividade

1. **Teste MongoDB:**
   ```bash
   curl https://seu-dominio.com/test-mongo
   ```

2. **Teste Status:**
   ```bash
   curl https://seu-dominio.com/status
   ```

3. **Verificar Logs:**
   - Console do servidor
   - Logs da hospedagem
   - Network tab do navegador

## Troubleshooting

### Se o histórico não salvar:
1. Verificar conexão MongoDB: `/test-mongo`
2. Verificar logs do servidor
3. Verificar se IP está na whitelist
4. Testar string de conexão localmente

### Se editar título não funcionar:
1. Verificar console do navegador
2. Verificar se sessão tem _id válido
3. Testar endpoint de atualização
4. Verificar permissões do usuário MongoDB

### Se gerar título falhar:
1. Verificar API Gemini
2. Verificar logs de erro
3. Testar endpoint de geração
4. Verificar formato da resposta

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Testar localmente
npm run dev

# Produção
npm start

# Verificar versões
node --version
npm --version
```

## Estrutura de Banco

### Coleção: sessoesChat
- sessionId: String (único)
- botId: String
- startTime: Date
- titulo: String
- messages: Array
- loggedAt: Date

### Coleção: tb_chat_historico
- data: String (YYYY-MM-DD)
- hora: String (HH:MM:SS)
- pergunta: String
- resposta: String
- tipo: String
- timestamp: Date

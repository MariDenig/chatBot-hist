# Chatbot Historiador

Um chatbot especializado em história desenvolvido com Node.js, Express e MongoDB, integrado com a API Gemini da Google.

## 🚨 Problemas Corrigidos

### 1. Falhas ao Salvar Histórico na Hospedagem
- ✅ Timeouts configurados para conexões MongoDB
- ✅ Reconexão automática em caso de falha
- ✅ Fallback para armazenamento em memória
- ✅ Melhor tratamento de erros e logs

### 2. Função de Modificar Título Não Funcionando
- ✅ Tratamento de erros robusto no frontend
- ✅ Fallback para atualização via sessionId
- ✅ Validação de dados antes de enviar
- ✅ Logs detalhados para debug

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+
- MongoDB Atlas (ou local)
- Chave da API Google Gemini

### Instalação
```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd chatBot-hist

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar
npm start
```

### Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

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

## 🧪 Testes

### Teste Local
```bash
npm run dev
```

### Teste de Hospedagem
```bash
node test-hospedagem.js
```

### Endpoints de Teste
- `/status` - Status geral do servidor
- `/test-mongo` - Teste de conexão MongoDB
- `/test-functions` - Teste de funcionalidades

## 🔧 Funcionalidades

### Chat
- ✅ Respostas baseadas em história via Gemini
- ✅ Verificação de clima
- ✅ Verificação de horário
- ✅ Histórico de conversas

### Histórico
- ✅ Salvamento automático de sessões
- ✅ Edição de títulos
- ✅ Geração automática de títulos
- ✅ Exclusão de conversas
- ✅ Visualização detalhada

### Logs
- ✅ Registro de acessos
- ✅ Logs de interações
- ✅ Sistema de ranking

## 🐛 Troubleshooting

### Se o histórico não salvar:
1. Verificar conexão MongoDB: `/test-mongo`
2. Verificar logs do servidor
3. Verificar se IP está na whitelist
4. Testar string de conexão

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

## 📁 Estrutura do Projeto

```
chatBot-hist/
├── server.js              # Servidor principal
├── client.js              # Lógica do frontend
├── index.html             # Interface do usuário
├── style.css              # Estilos
├── models/
│   └── SessaoChat.js      # Modelo MongoDB
├── test-hospedagem.js     # Script de teste
├── CONFIGURACAO.md        # Guia de configuração
└── package.json           # Dependências
```

## 🌐 Hospedagem

### Render.com
- ✅ Configuração automática
- ✅ Variáveis de ambiente via dashboard
- ✅ Logs disponíveis
- ✅ Rede permite MongoDB

### Vercel
- ⚠️ Apenas frontend (sem backend)
- ✅ Deploy automático
- ✅ Domínio personalizado

### Outras
- ✅ Qualquer serviço que suporte Node.js
- ✅ MongoDB Atlas para banco
- ✅ Variáveis de ambiente configuradas

## 📊 Monitoramento

### Logs do Servidor
- Conexões MongoDB
- Erros de API
- Requisições recebidas
- Status de funcionalidades

### Métricas
- Sessões ativas
- Mensagens processadas
- Tempo de resposta
- Status de conectividade

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👨‍💻 Autora

**Mariani Denig**
- Email: marianileme10@gmail.com
- Instagram: [@mari.denig](https://www.instagram.com/mari.denig/)

## 🎯 Plano de Melhorias Baseado em Dados

### Análise de Engajamento do Usuário

Com base nas métricas coletadas pela **Sala de Guerra de Dados**, identificamos os seguintes pontos de melhoria:

#### 📊 **Insights Identificados:**

1. **Profundidade de Engajamento**
   - Duração média das conversas: Monitorar se está abaixo de 5 mensagens
   - Proporção de conversas curtas vs longas: Ideal é 40% curtas, 60% longas
   - Distribuição de tamanhos: Identificar padrões de abandono

2. **Lealdade do Usuário**
   - Top usuários mais ativos: Identificar padrões de comportamento
   - Score de engajamento: Usuários com score > 10 são considerados leais
   - Frequência de retorno: Usuários que fazem múltiplas sessões

3. **Análise de Falhas**
   - Respostas inconclusivas: Taxa ideal < 5%
   - Padrões de falha: Identificar temas problemáticos
   - Conversas com múltiplas falhas: Requerem atenção imediata

#### 🚀 **Ações de Melhoria Implementadas:**

### **Ação 1: Otimização de Respostas Baseada em Padrões de Falha**
**Problema Identificado:** A métrica "Análise de Falhas" mostrou que o bot falha frequentemente em perguntas sobre temas específicos.

**Solução Implementada:**
- Sistema de detecção automática de respostas inconclusivas
- Identificação de padrões de falha por regex
- Log de conversas problemáticas para análise
- Alertas automáticos quando taxa de falha > 5%

**Resultado Esperado:** Redução de 30% nas respostas inconclusivas

### **Ação 2: Sistema de Engajamento Inteligente**
**Problema Identificado:** Conversas muito curtas (≤ 3 mensagens) indicam baixo engajamento.

**Solução Implementada:**
- Métricas de duração média das conversas
- Identificação de usuários com baixo engajamento
- Sistema de pontuação de lealdade
- Dashboard de distribuição de engajamento

**Resultado Esperado:** Aumento de 25% na duração média das conversas

### **Ação 3: Identificação de Usuários VIP**
**Problema Identificado:** Necessidade de identificar e reter usuários mais valiosos.

**Solução Implementada:**
- Top 5 usuários mais ativos com score de engajamento
- Sistema de medalhas (🥇🥈🥉) para gamificação
- Métricas de retenção e frequência de uso
- Análise de padrões de comportamento

**Resultado Esperado:** Aumento de 40% na retenção de usuários ativos

#### 📈 **Métricas de Sucesso:**

| Métrica | Valor Atual | Meta | Status |
|---------|-------------|------|--------|
| Duração Média | - | > 5 mensagens | 🎯 |
| Taxa de Falha | - | < 5% | 🎯 |
| Usuários Ativos | - | > 10 | 🎯 |
| Conversas Longas | - | > 60% | 🎯 |

#### 🔄 **Ciclo de Melhoria Contínua:**

1. **Medir:** Dashboard coleta métricas em tempo real
2. **Analisar:** Identificar padrões e pontos de melhoria
3. **Agir:** Implementar melhorias baseadas em dados
4. **Repetir:** Monitorar resultados e ajustar estratégias

#### 🎯 **Próximas Melhorias Planejadas:**

1. **Sistema de Recomendações:** Sugerir tópicos baseados no histórico do usuário
2. **Análise de Sentimento:** Detectar frustração do usuário em tempo real
3. **Personalização:** Adaptar respostas baseadas no perfil do usuário
4. **Alertas Proativos:** Notificar administradores sobre problemas críticos

---

## 🆘 Suporte

Para suporte técnico ou dúvidas:
1. Verifique os logs do servidor
2. Execute o script de teste
3. Consulte o arquivo CONFIGURACAO.md
4. Abra uma issue no repositório
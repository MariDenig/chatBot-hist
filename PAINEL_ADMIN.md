# 🤖 Painel Administrativo do Chatbot

## Visão Geral

O Painel Administrativo é uma interface web segura que permite monitorar e gerenciar o chatbot de forma centralizada. Ele oferece visibilidade completa sobre o uso do sistema e permite ajustar o comportamento do bot em tempo real.

## 🚀 Acesso ao Painel

### URL de Acesso
- **Local**: http://localhost:3000/admin
- **Produção**: https://seu-dominio.com/admin

### Credenciais
- **Senha**: `admin123` (configurável no arquivo .env)
- **Variável**: `ADMIN_SECRET` no arquivo .env

## 🔐 Segurança

### Autenticação
- O painel é protegido por senha secreta
- A senha é enviada via header `x-admin-secret` nas requisições
- Sem a senha correta, todas as APIs retornam "Acesso negado"

### Configuração da Senha
```bash
# No arquivo .env
ADMIN_SECRET=sua_senha_secreta_aqui
```

## 📊 Funcionalidades Principais

### 1. Dashboard de Métricas
- **Total de Conversas**: Número de sessões de chat criadas
- **Total de Mensagens**: Soma de todas as interações (usuário + bot)
- **Status MongoDB**: Estado da conexão com o banco de dados
- **Status do Servidor**: Estado geral do sistema

### 2. Monitoramento de Conversas
- **Últimas 5 Conversas**: Lista das conversas mais recentes
- **Detalhes por Conversa**:
  - Título da conversa
  - Data e hora de início
  - Número de mensagens
  - ID da sessão

### 3. Controle da IA
- **Instrução de Sistema**: Editar a personalidade global do bot
- **Carregar Atual**: Ver a instrução atualmente configurada
- **Salvar Nova**: Aplicar uma nova personalidade
- **Resetar Padrão**: Voltar à configuração original

### 4. Estatísticas Detalhadas
- **Conversas Hoje**: Número de conversas iniciadas hoje
- **Mensagens Hoje**: Mensagens trocadas hoje
- **Tempo Médio**: Duração média das conversas
- **Última Atividade**: Quando o sistema foi usado pela última vez

## 🎯 Como Usar

### 1. Fazer Login
1. Acesse a URL do painel
2. Digite a senha de administrador
3. Clique em "🔐 Entrar"

### 2. Monitorar o Sistema
- As métricas são atualizadas automaticamente a cada 30 segundos
- Use o botão "🔄" para atualizar manualmente
- Monitore o status do MongoDB e do servidor

### 3. Gerenciar a Personalidade do Bot
1. Clique em "📥 Carregar Atual" para ver a instrução atual
2. Edite o texto no campo de texto
3. Clique em "💾 Salvar Nova Instrução" para aplicar
4. Use "🔄 Resetar Padrão" para voltar ao comportamento original

### 4. Atalhos de Teclado
- **Ctrl+R**: Atualizar dados
- **Ctrl+S**: Salvar instrução
- **Enter**: Fazer login (no campo de senha)

## 🔧 Configuração Técnica

### APIs Disponíveis

#### GET /api/admin/stats
Retorna estatísticas do sistema
```bash
curl -H "x-admin-secret: admin123" http://localhost:3000/api/admin/stats
```

#### GET /api/admin/system-instruction
Retorna a instrução atual do sistema
```bash
curl -H "x-admin-secret: admin123" http://localhost:3000/api/admin/system-instruction
```

#### POST /api/admin/system-instruction
Salva uma nova instrução
```bash
curl -X POST \
  -H "x-admin-secret: admin123" \
  -H "Content-Type: application/json" \
  -d '{"instruction":"Nova personalidade do bot"}' \
  http://localhost:3000/api/admin/system-instruction
```

### Estrutura de Dados

#### Resposta de Estatísticas
```json
{
  "mongoConnected": true,
  "totalConversas": 6,
  "totalMensagens": 12,
  "ultimasConversas": [
    {
      "sessionId": "session_1234567890_abc123",
      "titulo": "Conversa sobre História",
      "startTime": "2025-09-28T19:30:00.000Z",
      "messages": 4
    }
  ]
}
```

## 🛠️ Manutenção

### Logs do Sistema
- Verifique os logs do servidor para monitorar acessos
- Logs de erro são exibidos no console do navegador
- Use F12 para abrir as ferramentas de desenvolvedor

### Backup da Configuração
- A instrução do sistema é salva no MongoDB
- Coleção: `configuracoes`
- Chave: `system_instruction`

### Monitoramento de Performance
- O painel atualiza automaticamente a cada 30 segundos
- Use o botão de refresh para atualizações manuais
- Monitore o status do MongoDB para problemas de conectividade

## 🚨 Solução de Problemas

### Erro "Acesso Negado"
- Verifique se a senha está correta
- Confirme se a variável `ADMIN_SECRET` está definida no .env
- Reinicie o servidor após alterar o .env

### MongoDB Desconectado
- Verifique a string de conexão no .env
- Confirme se o IP está na whitelist do MongoDB Atlas
- Verifique se as credenciais estão corretas

### Dados Não Atualizam
- Verifique se o servidor está rodando
- Confirme se não há erros no console do navegador
- Teste a conectividade com o servidor

## 📈 Próximos Passos

### Melhorias Futuras
- [ ] Gráficos de uso ao longo do tempo
- [ ] Exportação de relatórios
- [ ] Notificações em tempo real
- [ ] Múltiplos usuários administradores
- [ ] Logs de auditoria detalhados

### Integrações
- [ ] Slack/Discord para notificações
- [ ] Google Analytics para métricas web
- [ ] Prometheus para monitoramento avançado

---

**Desenvolvido com ❤️ para o projeto ChatBot História**

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE 
        || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://chatbot-historia.onrender.com');

    // Elementos do DOM
    const inputSecret = document.getElementById('admin-secret');
    const btnLogin = document.getElementById('btn-login');
    const loginStatus = document.getElementById('login-status');
    const adminContent = document.getElementById('admin-content');
    const refreshBtn = document.getElementById('refresh-btn');

    // Elementos de métricas
    const elTotalConversas = document.getElementById('metric-total-conversas');
    const elTotalMensagens = document.getElementById('metric-total-mensagens');
    const elMongo = document.getElementById('metric-mongo');
    const elServer = document.getElementById('metric-server');
    const ulUltimas = document.getElementById('ultimas-conversas');

    // Elementos de instrução
    const txtInstrucao = document.getElementById('system-instruction');
    const btnCarregarInstrucao = document.getElementById('btn-carregar-instrucao');
    const btnSalvarInstrucao = document.getElementById('btn-salvar-instrucao');
    const btnResetInstrucao = document.getElementById('btn-reset-instrucao');
    const instrucaoStatus = document.getElementById('instrucao-status');

    // Elementos de estatísticas detalhadas
    const elConversasHoje = document.getElementById('conversas-hoje');
    const elMensagensHoje = document.getElementById('mensagens-hoje');
    const elTempoMedio = document.getElementById('tempo-medio');
    const elUltimaAtividade = document.getElementById('ultima-atividade');

    let adminSecret = '';
    let isLoggedIn = false;
    let refreshInterval = null;

    // Instrução padrão do sistema
    const defaultInstruction = 'Você é um historiador especializado. Responda de forma clara, precisa e didática, sempre fornecendo contexto histórico relevante quando apropriado.';

    function setLoggedIn(logged) {
        isLoggedIn = logged;
        if (logged) {
            adminContent.classList.remove('hidden');
            loginStatus.textContent = '✅ Acesso concedido';
            loginStatus.className = 'status-msg status-success';
            
            // Iniciar atualização automática
            startAutoRefresh();
            
            // Carregar dados iniciais
            loadAllData();
        } else {
            adminContent.classList.add('hidden');
            loginStatus.textContent = '❌ Acesso negado';
            loginStatus.className = 'status-msg status-error';
            stopAutoRefresh();
        }
    }

    function startAutoRefresh() {
        // Atualizar dados a cada 30 segundos
        refreshInterval = setInterval(() => {
            if (isLoggedIn) {
                loadAllData();
            }
        }, 30000);
    }

    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }

    async function fetchStats() {
        const resp = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: { 'x-admin-secret': adminSecret }
        });
        if (!resp.ok) throw new Error('Falha ao carregar estatísticas');
        return resp.json();
    }

    async function fetchServerStatus() {
        try {
            const resp = await fetch(`${API_BASE}/status`);
            if (resp.ok) {
                const status = await resp.json();
                return {
                    online: true,
                    mongodb: status.mongodb === 'connected',
                    timestamp: status.timestamp
                };
            }
        } catch (e) {
            console.warn('Erro ao verificar status do servidor:', e);
        }
        return { online: false, mongodb: false, timestamp: null };
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatRelativeTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        return `${diffDays}d atrás`;
    }

    async function loadAllData() {
        try {
            // Mostrar loading
            showLoading(true);
            
            // Carregar estatísticas e status em paralelo
            const [stats, serverStatus] = await Promise.all([
                fetchStats(),
                fetchServerStatus()
            ]);

            // Atualizar métricas principais
            elTotalConversas.textContent = stats.totalConversas || 0;
            elTotalMensagens.textContent = stats.totalMensagens || 0;
            elMongo.textContent = stats.mongoConnected ? '✅ Conectado' : '❌ Desconectado';
            elMongo.className = stats.mongoConnected ? 'metric-value' : 'metric-value';
            elServer.textContent = serverStatus.online ? '✅ Online' : '❌ Offline';
            elServer.className = serverStatus.online ? 'metric-value' : 'metric-value';

            // Atualizar lista de conversas
            ulUltimas.innerHTML = '';
            if (stats.ultimasConversas && stats.ultimasConversas.length > 0) {
                stats.ultimasConversas.forEach(c => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="conversa-titulo">${c.titulo || 'Conversa Sem Título'}</div>
                        <div class="conversa-meta">
                            📅 ${formatDate(c.startTime)} • 
                            💬 ${c.messages || 0} mensagens • 
                            🆔 ${c.sessionId?.substring(0, 8) || 'N/A'}...
                        </div>
                    `;
                    ulUltimas.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.innerHTML = '<div class="conversa-titulo">Nenhuma conversa encontrada</div>';
                ulUltimas.appendChild(li);
            }

            // Atualizar estatísticas detalhadas
            updateDetailedStats(stats, serverStatus);

        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            showStatus('❌ Erro ao carregar dados: ' + e.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    function updateDetailedStats(stats, serverStatus) {
        // Calcular conversas hoje (simulação - em produção seria calculado no backend)
        const hoje = new Date().toDateString();
        const conversasHoje = stats.ultimasConversas?.filter(c => {
            if (!c.startTime) return false;
            return new Date(c.startTime).toDateString() === hoje;
        }).length || 0;

        elConversasHoje.textContent = conversasHoje;
        elMensagensHoje.textContent = Math.floor((stats.totalMensagens || 0) * 0.1); // Simulação
        elTempoMedio.textContent = '5min'; // Simulação
        elUltimaAtividade.textContent = formatRelativeTime(serverStatus.timestamp);
    }

    function showLoading(show) {
        const loadingElements = document.querySelectorAll('.metric-value');
        loadingElements.forEach(el => {
            if (show) {
                el.innerHTML = '<div class="loading"></div>';
            }
        });
    }

    function showStatus(message, type = 'info') {
        loginStatus.textContent = message;
        loginStatus.className = `status-msg status-${type}`;
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            if (loginStatus.textContent === message) {
                loginStatus.textContent = '';
                loginStatus.className = 'status-msg';
            }
        }, 5000);
    }

    async function carregarInstrucao() {
        try {
            instrucaoStatus.textContent = '⏳ Carregando...';
            instrucaoStatus.className = 'status-msg status-info';
            
            const resp = await fetch(`${API_BASE}/api/admin/system-instruction`, {
                headers: { 'x-admin-secret': adminSecret }
            });
            
            if (!resp.ok) throw new Error('Falha ao carregar instrução');
            
            const data = await resp.json();
            txtInstrucao.value = data.instruction || '';
            
            instrucaoStatus.textContent = '✅ Instrução carregada com sucesso';
            instrucaoStatus.className = 'status-msg status-success';
        } catch (e) {
            instrucaoStatus.textContent = '❌ Erro: ' + e.message;
            instrucaoStatus.className = 'status-msg status-error';
        }
    }

    async function salvarInstrucao() {
        try {
            const instruction = txtInstrucao.value.trim();
            if (!instruction) {
                instrucaoStatus.textContent = '⚠️ Digite uma instrução válida';
                instrucaoStatus.className = 'status-msg status-error';
                return;
            }
            
            instrucaoStatus.textContent = '⏳ Salvando...';
            instrucaoStatus.className = 'status-msg status-info';
            
            const resp = await fetch(`${API_BASE}/api/admin/system-instruction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': adminSecret
                },
                body: JSON.stringify({ instruction })
            });
            
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || 'Falha ao salvar instrução');
            }
            
            instrucaoStatus.textContent = '✅ Instrução salva com sucesso!';
            instrucaoStatus.className = 'status-msg status-success';
        } catch (e) {
            instrucaoStatus.textContent = '❌ Erro: ' + e.message;
            instrucaoStatus.className = 'status-msg status-error';
        }
    }

    function resetarInstrucao() {
        if (confirm('Tem certeza que deseja resetar para a instrução padrão?')) {
            txtInstrucao.value = defaultInstruction;
            instrucaoStatus.textContent = '🔄 Instrução resetada para o padrão';
            instrucaoStatus.className = 'status-msg status-info';
        }
    }

    // Event Listeners
    btnLogin.addEventListener('click', async () => {
        adminSecret = inputSecret.value.trim();
        if (!adminSecret) {
            showStatus('⚠️ Informe a senha de administrador', 'error');
            return;
        }
        
        try {
            showStatus('⏳ Verificando credenciais...', 'info');
            
            // Tenta carregar stats para validar
            await loadAllData();
            setLoggedIn(true);
        } catch (e) {
            setLoggedIn(false);
            showStatus('❌ Acesso negado: ' + e.message, 'error');
        }
    });

    // Enter no campo de senha
    inputSecret.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnLogin.click();
        }
    });

    // Botões de instrução
    btnCarregarInstrucao.addEventListener('click', carregarInstrucao);
    btnSalvarInstrucao.addEventListener('click', salvarInstrucao);
    btnResetInstrucao.addEventListener('click', resetarInstrucao);

    // Botão de refresh
    refreshBtn.addEventListener('click', () => {
        if (isLoggedIn) {
            loadAllData();
            showStatus('🔄 Dados atualizados', 'success');
        }
    });

    // Auto-carregar instrução quando logado
    const originalSetLoggedIn = setLoggedIn;
    setLoggedIn = (logged) => {
        originalSetLoggedIn(logged);
        if (logged) {
            // Carregar instrução atual após login
            setTimeout(() => {
                carregarInstrucao();
            }, 1000);
        }
    };

    // Limpar intervalos quando a página é fechada
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });

    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    if (isLoggedIn) {
                        loadAllData();
                        showStatus('🔄 Dados atualizados', 'success');
                    }
                    break;
                case 's':
                    e.preventDefault();
                    if (isLoggedIn) {
                        salvarInstrucao();
                    }
                    break;
            }
        }
    });

    // Inicialização
    console.log('🤖 Painel Administrativo do Chatbot carregado');
    console.log('💡 Dicas: Ctrl+R para atualizar, Ctrl+S para salvar instrução');
});



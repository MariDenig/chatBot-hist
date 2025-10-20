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

    // 🎯 NOVA FUNÇÃO: Buscar dados do Dashboard Estratégico
    async function fetchDashboardData() {
        const resp = await fetch(`${API_BASE}/api/admin/dashboard`, {
            headers: { 'x-admin-secret': adminSecret }
        });
        if (!resp.ok) throw new Error('Falha ao carregar dados do dashboard estratégico');
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
            
            // Carregar dados do dashboard estratégico e status em paralelo
            const [dashboardData, serverStatus] = await Promise.all([
                fetchDashboardData(),
                fetchServerStatus()
            ]);

            // Atualizar métricas principais
            elTotalConversas.textContent = dashboardData.totalConversas || 0;
            elTotalMensagens.textContent = dashboardData.totalMensagens || 0;
            elMongo.textContent = dashboardData.mongoConnected ? '✅ Conectado' : '❌ Desconectado';
            elMongo.className = dashboardData.mongoConnected ? 'metric-value' : 'metric-value';
            elServer.textContent = serverStatus.online ? '✅ Online' : '❌ Offline';
            elServer.className = serverStatus.online ? 'metric-value' : 'metric-value';

            // Atualizar lista de conversas
            ulUltimas.innerHTML = '';
            if (dashboardData.ultimasConversas && dashboardData.ultimasConversas.length > 0) {
                dashboardData.ultimasConversas.forEach(c => {
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

            // 🎯 ATUALIZAR MÓDULOS DA SALA DE GUERRA DE DADOS
            updateWarRoomModules(dashboardData);

            // Atualizar estatísticas detalhadas
            updateDetailedStats(dashboardData, serverStatus);

        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            showStatus('❌ Erro ao carregar dados: ' + e.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    // 🎯 FUNÇÃO PRINCIPAL: Atualizar Módulos da Sala de Guerra de Dados
    function updateWarRoomModules(data) {
        console.log('🎯 Atualizando módulos da Sala de Guerra de Dados...');
        
        // 1. PROFUNDIDADE DE ENGAJAMENTO
        updateEngagementMetrics(data);
        
        // 2. LEALDADE DO USUÁRIO
        updateUserLoyalty(data);
        
        // 3. ANÁLISE DE FALHAS
        updateFailureAnalysis(data);
        
        console.log('✅ Módulos da Sala de Guerra atualizados com sucesso!');
    }

    // 📊 Módulo: Profundidade de Engajamento
    function updateEngagementMetrics(data) {
        // Atualizar métricas básicas
        document.getElementById('duracao-media').textContent = data.duracaoMedia || 0;
        document.getElementById('conversas-curtas').textContent = data.conversasCurtas || 0;
        document.getElementById('conversas-longas').textContent = data.conversasLongas || 0;
        
        // Atualizar distribuição detalhada
        const distribuicaoEl = document.getElementById('distribuicao-engajamento');
        if (data.distribuicaoDetalhada && data.distribuicaoDetalhada.length > 0) {
            distribuicaoEl.innerHTML = '';
            
            data.distribuicaoDetalhada.forEach(item => {
                const div = document.createElement('div');
                div.className = 'distribution-item';
                
                let label = '';
                switch(item._id) {
                    case 0: label = '0-1 mensagens'; break;
                    case 2: label = '2-4 mensagens'; break;
                    case 5: label = '5-9 mensagens'; break;
                    case 10: label = '10-19 mensagens'; break;
                    case 20: label = '20-49 mensagens'; break;
                    case 50: label = '50-99 mensagens'; break;
                    case 100: label = '100+ mensagens'; break;
                    case 'muito_longas': label = 'Muito Longas (100+)'; break;
                    default: label = `${item._id} mensagens`;
                }
                
                div.innerHTML = `
                    <span class="distribution-label">${label}</span>
                    <span class="distribution-count">${item.count}</span>
                `;
                distribuicaoEl.appendChild(div);
            });
        } else {
            distribuicaoEl.innerHTML = '<div class="no-data">Nenhuma distribuição disponível</div>';
        }
    }

    // 👥 Módulo: Lealdade do Usuário
    function updateUserLoyalty(data) {
        const topUsuariosEl = document.getElementById('top-usuarios');
        
        if (data.topUsuarios && data.topUsuarios.length > 0) {
            topUsuariosEl.innerHTML = '';
            
            data.topUsuarios.forEach((user, index) => {
                const div = document.createElement('div');
                div.className = 'user-item';
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                
                div.innerHTML = `
                    <div class="user-info">
                        <div class="user-id">${medal} ${user.userId.substring(0, 12)}...</div>
                        <div class="user-stats">
                            📊 ${user.totalSessoes} sessões • 💬 ${user.totalMensagens} mensagens • 
                            🕒 ${formatRelativeTime(user.ultimaAtividade)}
                        </div>
                    </div>
                    <div class="user-score">${user.engajamentoScore}</div>
                `;
                topUsuariosEl.appendChild(div);
            });
        } else {
            topUsuariosEl.innerHTML = '<div class="no-data">Nenhum usuário ativo identificado</div>';
        }
    }

    // 🔍 Módulo: Análise de Falhas
    function updateFailureAnalysis(data) {
        // Atualizar métricas de falha
        document.getElementById('respostas-inconclusivas').textContent = data.respostasInconclusivas || 0;
        
        // Calcular taxa de falha
        const totalMensagens = data.totalMensagens || 1;
        const taxaFalha = ((data.respostasInconclusivas || 0) / totalMensagens * 100).toFixed(1);
        document.getElementById('taxa-falha').textContent = `${taxaFalha}%`;
        
        // Atualizar log de falhas
        const conversasFalhaEl = document.getElementById('conversas-falha');
        
        if (data.conversasComFalha && data.conversasComFalha.length > 0) {
            conversasFalhaEl.innerHTML = '';
            
            data.conversasComFalha.forEach(conv => {
                const div = document.createElement('div');
                div.className = 'failure-item';
                
                let exemplosHtml = '';
                if (conv.exemplosFalhas && conv.exemplosFalhas.length > 0) {
                    exemplosHtml = '<div class="failure-examples">';
                    conv.exemplosFalhas.forEach(falha => {
                        exemplosHtml += `<div class="failure-example">"${falha.content.substring(0, 100)}${falha.content.length > 100 ? '...' : ''}"</div>`;
                    });
                    exemplosHtml += '</div>';
                }
                
                div.innerHTML = `
                    <div class="failure-session">
                        🚨 ${conv.titulo || 'Conversa Sem Título'}
                        <span class="failure-count">${conv.totalFalhas} falhas</span>
                    </div>
                    ${exemplosHtml}
                `;
                conversasFalhaEl.appendChild(div);
            });
        } else {
            conversasFalhaEl.innerHTML = '<div class="no-data">🎉 Nenhuma falha detectada! O bot está funcionando perfeitamente.</div>';
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



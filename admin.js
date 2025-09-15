document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE 
        || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            ? 'http://localhost:3001'
            : 'https://chatbot-historia.onrender.com');

    const inputSecret = document.getElementById('admin-secret');
    const btnLogin = document.getElementById('btn-login');
    const loginStatus = document.getElementById('login-status');
    const adminContent = document.getElementById('admin-content');

    const elTotalConversas = document.getElementById('metric-total-conversas');
    const elTotalMensagens = document.getElementById('metric-total-mensagens');
    const elMongo = document.getElementById('metric-mongo');
    const ulUltimas = document.getElementById('ultimas-conversas');

    const txtInstrucao = document.getElementById('system-instruction');
    const btnCarregarInstrucao = document.getElementById('btn-carregar-instrucao');
    const btnSalvarInstrucao = document.getElementById('btn-salvar-instrucao');
    const instrucaoStatus = document.getElementById('instrucao-status');

    let adminSecret = '';

    function setLoggedIn(logged) {
        if (logged) {
            adminContent.classList.remove('hidden');
            loginStatus.textContent = 'Acesso concedido';
        } else {
            adminContent.classList.add('hidden');
        }
    }

    async function fetchStats() {
        const resp = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: { 'x-admin-secret': adminSecret }
        });
        if (!resp.ok) throw new Error('Falha ao carregar estatísticas');
        return resp.json();
    }

    async function renderStats() {
        try {
            const stats = await fetchStats();
            elTotalConversas.textContent = stats.totalConversas;
            elTotalMensagens.textContent = stats.totalMensagens;
            elMongo.textContent = stats.mongoConnected ? 'Conectado' : 'Desconectado';
            ulUltimas.innerHTML = '';
            (stats.ultimasConversas || []).forEach(c => {
                const li = document.createElement('li');
                const data = c.startTime ? new Date(c.startTime).toLocaleString('pt-BR') : '-';
                li.textContent = `${c.titulo} — ${data} — ${c.messages} mensagens`;
                ulUltimas.appendChild(li);
            });
        } catch (e) {
            loginStatus.textContent = e.message;
        }
    }

    async function carregarInstrucao() {
        try {
            instrucaoStatus.textContent = 'Carregando...';
            const resp = await fetch(`${API_BASE}/api/admin/system-instruction`, {
                headers: { 'x-admin-secret': adminSecret }
            });
            if (!resp.ok) throw new Error('Falha ao carregar instrução');
            const data = await resp.json();
            txtInstrucao.value = data.instruction || '';
            instrucaoStatus.textContent = 'OK';
        } catch (e) {
            instrucaoStatus.textContent = e.message;
        }
    }

    async function salvarInstrucao() {
        try {
            const instruction = txtInstrucao.value.trim();
            if (!instruction) {
                instrucaoStatus.textContent = 'Texto vazio';
                return;
            }
            instrucaoStatus.textContent = 'Salvando...';
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
            instrucaoStatus.textContent = 'Salvo!';
        } catch (e) {
            instrucaoStatus.textContent = e.message;
        }
    }

    btnLogin.addEventListener('click', async () => {
        adminSecret = inputSecret.value.trim();
        if (!adminSecret) {
            loginStatus.textContent = 'Informe a senha';
            return;
        }
        try {
            // Tenta carregar stats para validar
            await renderStats();
            setLoggedIn(true);
        } catch (e) {
            setLoggedIn(false);
            loginStatus.textContent = 'Acesso negado';
        }
    });

    btnCarregarInstrucao.addEventListener('click', carregarInstrucao);
    btnSalvarInstrucao.addEventListener('click', salvarInstrucao);
});



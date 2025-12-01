document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE;

    const inputUserId = document.getElementById('user-id');
    const btnCarregar = document.getElementById('btn-carregar');
    const btnSalvar = document.getElementById('btn-salvar');
    const apelidoInput = document.getElementById('apelido-bot');
    const txtInstrucao = document.getElementById('txt-instrucao');
    const statusEl = document.getElementById('status');
    const ativaEl = document.getElementById('ativa');

    function setStatus(msg, type = '') {
        statusEl.textContent = msg;
        statusEl.className = `status ${type}`;
        if (msg) setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 5000);
    }

    function carregarUserIdDoLocalStorage() {
        const savedId = localStorage.getItem('chat_user_id');
        if (savedId && !inputUserId.value) {
            inputUserId.value = savedId;
        }
    }

    function renderAtiva(instr) {
        if (instr && instr.trim()) {
            ativaEl.innerHTML = `Personalidade ativa: <span class="pill">Customizada pelo usuário</span>`;
        } else {
            ativaEl.innerHTML = `Personalidade ativa: <span class="pill">Global do administrador</span>`;
        }
    }

    async function carregar() {
        const userId = inputUserId.value.trim();
        if (!userId) {
            setStatus('Informe seu ID de usuário.', 'error');
            return;
        }
        try {
            setStatus('Carregando preferências...', '');
            const resp = await fetch(`${API_BASE}/api/user/preferences`, {
                headers: { 'x-user-id': userId }
            });
            if (!resp.ok) throw new Error('Falha ao carregar preferências');
            const data = await resp.json();
            txtInstrucao.value = data.systemInstruction || '';
            apelidoInput.value = data.apelidoBot || '';
            renderAtiva(data.systemInstruction || '');
            setStatus('Preferências carregadas com sucesso.', 'success');
        } catch (e) {
            setStatus(`Erro: ${e.message}`, 'error');
        }
    }

    async function salvar() {
        const userId = inputUserId.value.trim();
        const systemInstruction = txtInstrucao.value;
        const apelidoBot = apelidoInput.value.trim();
        if (!userId) {
            setStatus('Informe seu ID de usuário.', 'error');
            return;
        }
        try {
            setStatus('Salvando...', '');
            const resp = await fetch(`${API_BASE}/api/user/putpreferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({ systemInstruction, apelidoBot })
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || 'Falha ao salvar preferências');
            }
            const data = await resp.json();
            renderAtiva(data.systemInstruction || '');
            apelidoInput.value = data.apelidoBot || apelidoBot;
            setStatus('Personalidade salva com sucesso!', 'success');
        } catch (e) {
            setStatus(`Erro: ${e.message}`, 'error');
        }
    }

    btnCarregar.addEventListener('click', carregar);
    btnSalvar.addEventListener('click', salvar);

    carregarUserIdDoLocalStorage();
});



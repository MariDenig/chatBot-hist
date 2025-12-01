document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE;
    const inputNome = document.getElementById('nome');
    const inputEmail = document.getElementById('email');
    const btnLogin = document.getElementById('btn-login');
    const statusEl = document.getElementById('status-login');

    function setStatus(msg, type = '') {
        statusEl.textContent = msg;
        statusEl.className = `status ${type}`;
    }

    async function realizarLogin() {
        const nome = (inputNome.value || '').trim();
        const email = (inputEmail.value || '').trim().toLowerCase();

        if (!email) {
            setStatus('Informe um email válido para continuar.', 'error');
            return;
        }

        try {
            setStatus('Conectando...', '');
            btnLogin.disabled = true;

            const resp = await fetch(`${API_BASE}/api/auth/simple-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || 'Falha ao fazer login');
            }

            const data = await resp.json();
            if (!data.userId) {
                throw new Error('Resposta inválida do servidor (sem userId)');
            }

            // Persistir credenciais simples no navegador
            localStorage.setItem('chat_user_id', data.userId);
            localStorage.setItem('chat_user_nome', data.nome || '');
            localStorage.setItem('chat_user_email', data.email || email);

            setStatus('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = '/configuracoes.html';
            }, 800);
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            setStatus(`Erro: ${error.message}`, 'error');
        } finally {
            btnLogin.disabled = false;
        }
    }

    btnLogin.addEventListener('click', realizarLogin);
    inputEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarLogin();
        }
    });
});



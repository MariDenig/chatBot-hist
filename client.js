document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const historyButton = document.getElementById('history-button');
    const timeButton = document.getElementById('time-button');
    const weatherButton = document.getElementById('weather-button');
    const historyModal = document.getElementById('history-modal');
    const weatherModal = document.getElementById('weather-modal');
    const historyContent = document.getElementById('history-content');
    const closeButton = document.querySelector('.close-button');
    const closeWeatherButton = document.querySelector('.close-weather-button');
    const cityInput = document.getElementById('city-input');
    const checkWeatherButton = document.getElementById('check-weather-button');

    let chatHistory = []; // Armazenar o histórico da conversa
    let conversationHistory = []; // Armazenar conversas completas
    let isProcessing = false; // Controlar estado de processamento

    // Criar indicador de digitação
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);

    // Adicionar mensagem de boas-vindas
    addMessage('Olá! Eu sou o Chatbot Historiador. Estou aqui para responder suas perguntas sobre história. Como posso ajudar você hoje?');

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatMessage(text) {
        // Dividir o texto em parágrafos
        const paragraphs = text.split('\n\n');
        
        // Criar container para a mensagem formatada
        const formattedContainer = document.createElement('div');
        formattedContainer.className = 'formatted-message';
        
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                const p = document.createElement('p');
                
                // Verificar se é uma lista
                if (paragraph.startsWith('- ')) {
                    const listItems = paragraph.split('\n');
                    const ul = document.createElement('ul');
                    
                    listItems.forEach(item => {
                        if (item.trim()) {
                            const li = document.createElement('li');
                            li.textContent = item.replace('- ', '');
                            ul.appendChild(li);
                        }
                    });
                    
                    p.appendChild(ul);
                } else {
                    p.textContent = paragraph;
                }
                
                formattedContainer.appendChild(p);
            }
        });
        
        return formattedContainer;
    }

    function addMessage(message, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : isError ? 'error-message' : 'bot-message'}`;
        
        if (isUser) {
            messageDiv.textContent = message;
        } else {
            messageDiv.appendChild(formatMessage(message));
        }
        
        chatMessages.appendChild(messageDiv);
        // Garantir que o indicador de digitação fique sempre no final, se estiver visível
        if (typingIndicator && typingIndicator.style.display !== 'none') {
            chatMessages.appendChild(typingIndicator);
        }
        scrollToBottom();
    }

    function setLoading(isLoading) {
        isProcessing = isLoading;
        if (isLoading) {
            sendButton.disabled = true;
            sendButton.textContent = 'Enviando...';
            typingIndicator.style.display = 'block';
            // Reposicionar o indicador no final sempre que começar o carregamento
            chatMessages.appendChild(typingIndicator);
            scrollToBottom();
        } else {
            sendButton.disabled = false;
            sendButton.textContent = 'Enviar';
            typingIndicator.style.display = 'none';
        }
    }

    function handleError(error, type) {
        let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
        
        switch(type) {
            case 'auth_error':
                errorMessage = 'Erro de autenticação com a API. Por favor, contate o administrador.';
                break;
            case 'network_error':
                errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                break;
            case 'quota_error':
                errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
                break;
            case 'input_error':
                errorMessage = 'Por favor, digite uma mensagem válida.';
                break;
            case 'server_error':
                errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
                break;
        }
        
        addMessage(errorMessage, false, true);
        console.error('Erro:', error);
    }

    // Função para carregar histórico de sessões do MongoDB
    async function carregarHistoricoSessoes() {
        try {
            const response = await fetch('https://chatbot-historia.onrender.com/api/chat/historicos');
            
            if (!response.ok) {
                if (response.status === 503) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Servidor não conectado ao MongoDB');
                }
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const historicos = await response.json();
            console.log('Históricos carregados:', historicos);
            
            const listaSessoes = document.getElementById('lista-sessoes');
            listaSessoes.innerHTML = '';
            
            if (historicos.length === 0) {
                listaSessoes.innerHTML = `
                    <li class="sem-historico">
                        <i class="fas fa-inbox"></i>
                        <p>Nenhuma conversa salva ainda.</p>
                    </li>
                `;
                return;
            }
            
            historicos.forEach((sessao) => {
                const li = document.createElement('li');
                li.dataset.sessionId = sessao.sessionId;
                li.dataset.id = sessao._id;

                const dataFormatada = new Date(sessao.startTime).toLocaleString('pt-BR');
                const numMensagens = sessao.messages ? sessao.messages.length : 0;
                const tituloSessao = (sessao.titulo && String(sessao.titulo).trim()) ? sessao.titulo.trim() : 'Conversa Sem Título';

                li.innerHTML = `
                    <div class="sessao-topo">
                        <span class="sessao-titulo">${tituloSessao}</span>
                        <div class="sessao-acoes">
                            <button class="gerar-titulo-btn" title="Gerar Título">✨</button>
                            <button class="excluir-btn" title="Excluir">🗑️</button>
                        </div>
                    </div>
                    <div class="sessao-info">
                        <span class="sessao-data">${dataFormatada}</span>
                        <span class="sessao-bot">${sessao.botId || 'Chatbot'}</span>
                    </div>
                    <div class="sessao-mensagens">
                        ${numMensagens} mensagem${numMensagens !== 1 ? 's' : ''}
                    </div>
                `;

                li.addEventListener('click', () => {
                    // Remover classe ativa de todos os itens
                    document.querySelectorAll('#lista-sessoes li').forEach(item => {
                        item.classList.remove('sessao-ativa');
                    });

                    // Adicionar classe ativa ao item clicado
                    li.classList.add('sessao-ativa');

                    // Exibir conversa detalhada
                    exibirConversaDetalhada(sessao);
                });

                // Ações dos botões
                const btnExcluir = li.querySelector('.excluir-btn');
                const btnGerar = li.querySelector('.gerar-titulo-btn');

                btnExcluir.addEventListener('click', (e) => {
                    e.stopPropagation();
                    excluirSessao(sessao._id, li);
                });

                btnGerar.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await obterESalvarTitulo(sessao._id, li, btnGerar);
                });

                listaSessoes.appendChild(li);
            });
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            const listaSessoes = document.getElementById('lista-sessoes');
            listaSessoes.innerHTML = `
                <li class="sem-historico">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar histórico: ${error.message}</p>
                </li>
            `;
        }
    }
    
    // Função para exibir conversa detalhada
    function exibirConversaDetalhada(sessao) {
        const conversaDetalhada = document.getElementById('visualizacao-conversa-detalhada');
        
        if (!sessao.messages || sessao.messages.length === 0) {
            conversaDetalhada.innerHTML = `
                <h3>Detalhes da Conversa</h3>
                <div class="sem-historico">
                    <i class="fas fa-comments"></i>
                    <p>Nenhuma mensagem encontrada nesta sessão.</p>
                </div>
            `;
            return;
        }
        
        let html = '<h3>Detalhes da Conversa</h3>';
        
        sessao.messages.forEach(mensagem => {
            const timestamp = new Date(mensagem.timestamp || Date.now()).toLocaleString('pt-BR');
            const isUser = mensagem.role === 'user';
            
            html += `
                <div class="conversa-mensagem ${isUser ? 'usuario' : 'bot'}">
                    <div class="timestamp">${timestamp}</div>
                    <div class="content">${mensagem.content}</div>
                </div>
            `;
        });
        
        conversaDetalhada.innerHTML = html;
    }
    
    // Função para atualizar o modal de histórico (compatibilidade)
    function updateHistoryModal() {
        carregarHistoricoSessoes();
    }

    // Excluir sessão
    async function excluirSessao(sessionMongoId, elementoLi) {
        try {
            const confirmado = confirm('Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.');
            if (!confirmado) return;

            const response = await fetch(`https://chatbot-historia.onrender.com/api/chat/historicos/${sessionMongoId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                let mensagem = 'Falha ao excluir o histórico.';
                try {
                    const erro = await response.json();
                    mensagem = erro.error || mensagem;
                } catch {}
                alert(mensagem);
                return;
            }

            // Remover da UI
            elementoLi.remove();
            const conversaDetalhada = document.getElementById('visualizacao-conversa-detalhada');
            if (conversaDetalhada && !document.querySelector('#lista-sessoes li.sessao-ativa')) {
                conversaDetalhada.innerHTML = '';
            }
        } catch (error) {
            console.error('Erro ao excluir sessão:', error);
            alert('Erro ao excluir a sessão. Tente novamente.');
        }
    }

    // Gerar e salvar título da sessão
    async function obterESalvarTitulo(sessionMongoId, elementoLi, botaoAcionador) {
        let textoOriginalBotao;
        try {
            if (botaoAcionador) {
                textoOriginalBotao = botaoAcionador.textContent;
                botaoAcionador.disabled = true;
                botaoAcionador.textContent = 'Gerando...';
            }

            // Solicitar sugestão ao backend
            const respSugestao = await fetch(`https://chatbot-historia.onrender.com/api/chat/historicos/${sessionMongoId}/gerar-titulo`, {
                method: 'POST'
            });
            if (!respSugestao.ok) {
                let mensagem = 'Falha ao gerar título.';
                try {
                    const erro = await respSugestao.json();
                    mensagem = erro.error || mensagem;
                } catch {}
                alert(mensagem);
                return;
            }
            const { tituloSugerido } = await respSugestao.json();

            // Permitir edição/confirmação
            const tituloFinal = prompt('Sugerimos este título para a conversa. Você pode editar antes de salvar:', tituloSugerido || 'Conversa Sem Título');
            if (tituloFinal === null) {
                return; // cancelado pelo usuário
            }
            const tituloAjustado = String(tituloFinal).trim();
            if (!tituloAjustado) {
                alert('Título inválido. Operação cancelada.');
                return;
            }

            // Salvar título
            const respSalvar = await fetch(`https://chatbot-historia.onrender.com/api/chat/historicos/${sessionMongoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: tituloAjustado })
            });

            if (!respSalvar.ok) {
                let mensagem = 'Falha ao salvar título.';
                try {
                    const erro = await respSalvar.json();
                    mensagem = erro.error || mensagem;
                } catch {}
                alert(mensagem);
                return;
            }

            const atualizado = await respSalvar.json();
            const spanTitulo = elementoLi.querySelector('.sessao-titulo');
            if (spanTitulo) {
                spanTitulo.textContent = (atualizado && atualizado.titulo) ? atualizado.titulo : tituloAjustado;
            }
        } catch (error) {
            console.error('Erro ao gerar/salvar título:', error);
            alert('Erro ao gerar ou salvar o título. Tente novamente.');
        } finally {
            if (botaoAcionador) {
                botaoAcionador.disabled = false;
                botaoAcionador.textContent = textoOriginalBotao || 'Gerar Título';
            }
        }
    }

    // Funções para os botões de ação
    function checkCurrentTime() {
        if (isProcessing) return;
        setLoading(true);
        
        // Simular envio da mensagem do usuário
        const timeMessage = "Que horas são agora?";
        addMessage(timeMessage, true);
        
        // Enviar ao servidor
        processBotRequest(timeMessage);
    }

    function showWeatherModal() {
        weatherModal.style.display = 'block';
    }

    function checkWeather() {
        const city = cityInput.value.trim();
        if (!city || isProcessing) return;
        
        // Fechar o modal
        weatherModal.style.display = 'none';
        
        // Simular envio da mensagem do usuário
        const weatherMessage = `Como está o tempo em ${city}?`;
        addMessage(weatherMessage, true);
        setLoading(true);
        
        // Enviar ao servidor
        processBotRequest(weatherMessage);
    }

    async function processBotRequest(message) {
        try {
            console.log('Enviando mensagem para o servidor:', message);
            console.log('Histórico atual:', chatHistory);
            
            const response = await fetch('https://chatbot-historia.onrender.com/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    history: chatHistory
                }),
            });

            console.log('Resposta do servidor:', response.status);
            const data = await response.json();
            console.log('Dados recebidos do servidor:', data);

            if (!response.ok) {
                console.error('Erro na resposta do servidor:', data);
                throw new Error(data.details || data.error || 'Erro desconhecido');
            }

            // Atualizar histórico
            chatHistory = data.history;
            console.log('Histórico atualizado:', chatHistory);
            
            // Mostrar resposta do bot
            if (data.response) {
                addMessage(data.response);
            } else {
                console.error('Resposta inválida do servidor:', data);
                throw new Error('Resposta inválida do servidor');
            }

            // Adicionar à conversa atual
            if (chatHistory.length === 2) { // Nova conversa
                conversationHistory.push({
                    timestamp: new Date(),
                    messages: [
                        { text: message, isUser: true },
                        { text: data.response, isUser: false }
                    ]
                });
            } else {
                conversationHistory[conversationHistory.length - 1].messages.push(
                    { text: message, isUser: true },
                    { text: data.response, isUser: false }
                );
            }

            const functionCalls = data.functionCalls;
            console.log('functionCalls:', functionCalls);
            if (Array.isArray(functionCalls) && functionCalls.length > 0) {
                let currentResponse = data;
                for (const functionCall of functionCalls) {
                    // ...
                }
            }
        } catch (error) {
            console.error('Erro detalhado ao enviar mensagem:', error);
            console.error('Stack trace:', error.stack);
            handleError(error, error.type || 'api_error');
        } finally {
            setLoading(false);
        }
    }

    // Função para obter o IP do usuário
    async function getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Erro ao obter IP:', error);
            return '127.0.0.1'; // IP local como fallback
        }
    }

    // Função para registrar conexão do usuário
    async function registrarConexaoUsuario(acao) {
        try {
            const ip = await getUserIP();
            const logData = {
                ip: ip,
                acao: acao
            };

            const response = await fetch('https://chatbot-historia.onrender.com/api/log-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });

            if (!response.ok) {
                throw new Error('Falha ao registrar log');
            }

            console.log('Log registrado com sucesso');
        } catch (error) {
            console.error('Erro ao registrar log:', error);
        }
    }

    // Função para registrar acesso ao bot para ranking
    async function registrarAcessoBotParaRanking() {
        try {
            const dataRanking = {
                botId: "chatbotHistoriador",
                nomeBot: "Chatbot Historiador",
                timestampAcesso: new Date().toISOString()
            };

            const response = await fetch('https://chatbot-historia.onrender.com/api/ranking/registrar-acesso-bot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataRanking)
            });

            // Registrar log separadamente com os dados corretos
            const ip = await getUserIP();
            const logData = {
                ip: ip,
                acao: 'registro_ranking_bot',
                nomeBot: 'Mari_Chatbot'
            };
            
            const responseLog = await fetch('https://chatbot-historia.onrender.com/api/log-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });


            if (!response.ok) {
                throw new Error('Falha ao registrar acesso para ranking');
            }

            console.log('Acesso registrado para ranking');
        } catch (error) {
            console.error('Erro ao registrar acesso para ranking:', error);
        }
    }

    // Registrar acesso inicial
    registrarConexaoUsuario('acesso_inicial_chatbot_Mari');
    registrarAcessoBotParaRanking();

    // Modificar a função sendMessage para registrar logs
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message || isProcessing) return;

        setLoading(true);
        addMessage(message, true);
        userInput.value = '';

        try {
            await registrarConexaoUsuario('enviou_mensagem_chatbot');
            await processBotRequest(message);
        } catch (error) {
            handleError(error, 'server_error');
        } finally {
            setLoading(false);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isProcessing) {
            sendMessage();
        }
    });

    // Histórico
    historyButton.addEventListener('click', () => {
        updateHistoryModal();
        historyModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });

    // Botões de ação
    timeButton.addEventListener('click', checkCurrentTime);
    weatherButton.addEventListener('click', showWeatherModal);
    checkWeatherButton.addEventListener('click', checkWeather);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkWeather();
        }
    });
    closeWeatherButton.addEventListener('click', () => {
        weatherModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
        }
        if (e.target === weatherModal) {
            weatherModal.style.display = 'none';
        }
    });

    // Focar no input ao carregar a página
    userInput.focus();
});

document.addEventListener('DOMContentLoaded', () => {
    // Definir base da API dinamicamente (ambiente local vs produção)
    const API_BASE = window.API_BASE 
        || (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://chatbot-historia.onrender.com');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const historyButton = document.getElementById('history-button');
    const adminButton = document.getElementById('admin-button');
    const timeButton = document.getElementById('time-button');
    const weatherButton = document.getElementById('weather-button');
    const historyModal = document.getElementById('history-modal');
    const weatherModal = document.getElementById('weather-modal');
    const historyContent = document.getElementById('history-content');
    const closeButton = document.querySelector('.close-button');
    const closeWeatherButton = document.querySelector('.close-weather-button');
    const cityInput = document.getElementById('city-input');
    const checkWeatherButton = document.getElementById('check-weather-button');
    const statusIndicator = document.getElementById('status-indicator'); // Adicionar indicador de status

    let chatHistory = []; // Armazenar o histórico da conversa
    let conversationHistory = []; // Armazenar conversas completas
    let isProcessing = false; // Controlar estado de processamento
    let sessionId = localStorage.getItem('chat_session_id') || null;
    let backendOnline = false; // Estado do backend

    // Criar indicador de digitação
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);

    // Adicionar indicador de tempo de resposta
    const responseTimeIndicator = document.createElement('div');
    responseTimeIndicator.className = 'response-time-indicator';
    responseTimeIndicator.style.display = 'none';
    chatMessages.appendChild(responseTimeIndicator);

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
            responseTimeIndicator.style.display = 'block';
            responseTimeIndicator.textContent = 'Processando...';
            // Reposicionar o indicador no final sempre que começar o carregamento
            chatMessages.appendChild(typingIndicator);
            chatMessages.appendChild(responseTimeIndicator);
            scrollToBottom();
        } else {
            sendButton.disabled = false;
            sendButton.textContent = 'Enviar';
            typingIndicator.style.display = 'none';
            responseTimeIndicator.style.display = 'none';
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

    // Função para verificar status do servidor
    async function verificarStatusServidor() {
        try {
            const response = await fetch(`${API_BASE}/status`);
            if (response.ok) {
                const status = await response.json();
                console.log('Status do servidor:', status);
                
                // Atualizar indicador visual
                const statusIndicator = document.getElementById('status-indicator');
                if (statusIndicator) {
                    if (status.mongodb === 'connected') {
                        statusIndicator.className = 'status-indicator online';
                        statusIndicator.title = 'Servidor online - MongoDB conectado';
                        statusIndicator.innerHTML = '🟢';
                    } else {
                        statusIndicator.className = 'status-indicator offline';
                        statusIndicator.title = 'Servidor online - MongoDB desconectado';
                        statusIndicator.innerHTML = '🟡';
                    }
                }
                backendOnline = true;
                
                return status;
            } else {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            
            // Atualizar indicador visual para offline
            const statusIndicator = document.getElementById('status-indicator');
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator offline';
                statusIndicator.title = 'Servidor offline';
                statusIndicator.innerHTML = '🔴';
            }
            backendOnline = false;
            
            return null;
        }
    }

    // Função para carregar histórico de sessões do MongoDB
    async function carregarHistoricoSessoes() {
        let tentativas = 0;
        const maxTentativas = 3;
        
        const tentarCarregar = async () => {
            try {
                tentativas++;
                console.log(`Tentativa ${tentativas} de carregar histórico de sessões...`);
                
                const response = await fetch(`${API_BASE}/api/chat/historicos`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 503 && tentativas < maxTentativas) {
                        console.log('Servidor indisponível (503), tentando novamente...');
                        await new Promise(resolve => setTimeout(resolve, 2000 * tentativas)); // Delay progressivo
                        return false; // Tentar novamente
                    } else if (response.status === 503) {
                        throw new Error('Servidor temporariamente indisponível. Tente novamente em alguns instantes.');
                    } else if (response.status === 503) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Servidor não conectado ao MongoDB');
                    } else {
                        throw new Error(`Erro ${response.status}: ${response.statusText}`);
                    }
                }
                
                const historicos = await response.json();
                console.log('Históricos carregados:', historicos);
                
                const listaSessoes = document.getElementById('lista-sessoes');
                if (!listaSessoes) {
                    console.error('Elemento lista-sessoes não encontrado');
                    return true; // Sucesso, mas não pode atualizar UI
                }
                
                listaSessoes.innerHTML = '';
                
                if (!Array.isArray(historicos) || historicos.length === 0) {
                    listaSessoes.innerHTML = `
                        <li class="sem-historico">
                            <i class="fas fa-inbox"></i>
                            <p>Nenhuma conversa salva ainda.</p>
                        </li>
                    `;
                    return true;
                }
                
                historicos.forEach((sessao) => {
                    if (!sessao || !sessao.sessionId) {
                        console.warn('Sessão inválida encontrada:', sessao);
                        return;
                    }
                    
                    const li = document.createElement('li');
                    li.dataset.sessionId = sessao.sessionId;
                    li.dataset.id = sessao._id || '';

                    const dataFormatada = sessao.startTime ? 
                        new Date(sessao.startTime).toLocaleString('pt-BR') : 
                        'Data não disponível';
                    const numMensagens = sessao.messages && Array.isArray(sessao.messages) ? sessao.messages.length : 0;
                    const tituloSessao = (sessao.titulo && String(sessao.titulo).trim()) ? sessao.titulo.trim() : 'Conversa Sem Título';

                    li.innerHTML = `
                        <div class="sessao-topo">
                            <span class="sessao-titulo">${tituloSessao}</span>
                            <div class="sessao-acoes">
                                <button class="gerar-titulo-btn" title="Gerar Título">✨</button>
                                <button class="editar-titulo-btn" title="Editar Título">✏️</button>
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

                    // Adicionar evento de clique para exibir conversa
                    li.addEventListener('click', (e) => {
                        // Não ativar se clicou em um botão
                        if (e.target.tagName === 'BUTTON') {
                            return;
                        }
                        
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
                    const btnEditar = li.querySelector('.editar-titulo-btn');

                    // Desabilitar ações quando não houver _id (dados de exemplo/sem Mongo)
                    if (!sessao._id) {
                        btnExcluir.disabled = true;
                        btnGerar.disabled = true;
                        btnEditar.disabled = false; // permitir editar via sessionId no fallback
                        btnExcluir.title = 'Indisponível sem conexão ao banco';
                        btnGerar.title = 'Indisponível sem conexão ao banco';
                    }

                    // Evento de exclusão
                    btnExcluir.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (sessao._id) {
                            excluirSessao(sessao._id, li);
                        } else {
                            alert('Exclusão não disponível sem conexão ao banco de dados');
                        }
                    });

                    // Evento de geração de título
                    btnGerar.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (sessao._id) {
                            await obterESalvarTitulo(sessao._id, li, btnGerar);
                        } else {
                            alert('Geração de título não disponível sem conexão ao banco de dados');
                        }
                    });

                    // Evento de edição de título
                    btnEditar.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const atual = (sessao.titulo && String(sessao.titulo).trim()) ? sessao.titulo.trim() : 'Conversa Sem Título';
                        const novo = prompt('Editar título da conversa:', atual);
                        if (novo === null) return; // Usuário cancelou
                        
                        const tituloAjustado = String(novo).trim();
                        if (!tituloAjustado) { 
                            alert('Título inválido. O título não pode estar vazio.'); 
                            return; 
                        }

                        try {
                            let resp;
                            let atualizado;
                            let tentativas = 0;
                            const maxTentativas = 3;
                            
                            // Função para tentar atualizar com retry
                            const tentarAtualizar = async () => {
                                tentativas++;
                                console.log(`Tentativa ${tentativas} de atualizar título...`);
                                
                                if (sessao._id) {
                                    // Tentar atualizar via MongoDB primeiro
                                    resp = await fetch(`${API_BASE}/api/chat/historicos/${sessao._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ titulo: tituloAjustado })
                                    });
                                    
                                    if (resp.ok) {
                                        atualizado = await resp.json();
                                        console.log('Título atualizado via MongoDB:', atualizado);
                                        return true;
                                    } else if (resp.status === 503 && tentativas < maxTentativas) {
                                        console.log('Servidor indisponível (503), tentando novamente...');
                                        await new Promise(resolve => setTimeout(resolve, 2000 * tentativas)); // Delay progressivo
                                        return false; // Tentar novamente
                                    } else {
                                        throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
                                    }
                                } else if (sessao.sessionId) {
                                    // Fallback: atualizar via sessionId
                                    resp = await fetch(`${API_BASE}/api/chat/historicos/session/${sessao.sessionId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ titulo: tituloAjustado })
                                    });
                                    
                                    if (resp.ok) {
                                        atualizado = await resp.json();
                                        console.log('Título atualizado via sessionId:', atualizado);
                                        return true;
                                    } else if (resp.status === 503 && tentativas < maxTentativas) {
                                        console.log('Servidor indisponível (503), tentando novamente...');
                                        await new Promise(resolve => setTimeout(resolve, 2000 * tentativas)); // Delay progressivo
                                        return false; // Tentar novamente
                                    } else {
                                        throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
                                    }
                                } else {
                                    alert('Não foi possível identificar a sessão para edição.');
                                    return true; // Não é um erro, apenas não pode continuar
                                }
                            };
                            
                            // Loop de tentativas
                            let sucesso = false;
                            while (!sucesso && tentativas < maxTentativas) {
                                try {
                                    sucesso = await tentarAtualizar();
                                } catch (error) {
                                    if (tentativas >= maxTentativas) {
                                        throw error;
                                    }
                                    console.log(`Tentativa ${tentativas} falhou, tentando novamente...`);
                                }
                            }
                            
                            if (!sucesso) {
                                throw new Error(`Falha após ${maxTentativas} tentativas`);
                            }

                            // Atualizar a UI
                            const spanTitulo = li.querySelector('.sessao-titulo');
                            if (spanTitulo) {
                                spanTitulo.textContent = (atualizado && atualizado.titulo) ? atualizado.titulo : tituloAjustado;
                            }
                            
                            // Atualizar o objeto da sessão localmente
                            sessao.titulo = tituloAjustado;
                            
                            // Mostrar confirmação
                            console.log('Título atualizado com sucesso:', tituloAjustado);
                            
                        } catch (err) {
                            console.error('Erro ao editar título:', err);
                            
                            // Tratamento específico para erro 503
                            if (err.message.includes('503')) {
                                alert('Servidor temporariamente indisponível. Tente novamente em alguns instantes ou use o botão de histórico para recarregar.');
                                
                                // Tentar recarregar o histórico para verificar status
                                setTimeout(() => {
                                    console.log('Tentando recarregar histórico...');
                                    carregarHistoricoSessoes();
                                }, 3000);
                            } else {
                                alert(`Erro ao editar o título: ${err.message}. Tente novamente.`);
                            }
                        }
                    });

                    listaSessoes.appendChild(li);
                });
                
                return true; // Sucesso
                
            } catch (error) {
                console.error(`Erro na tentativa ${tentativas} ao carregar histórico:`, error);
                
                if (tentativas < maxTentativas) {
                    console.log(`Tentando novamente em ${2000 * tentativas}ms...`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * tentativas));
                    return false; // Tentar novamente
                } else {
                    throw error; // Falha definitiva
                }
            }
        };
        
        // Loop de tentativas
        let sucesso = false;
        while (!sucesso && tentativas < maxTentativas) {
            try {
                sucesso = await tentarCarregar();
            } catch (error) {
                if (tentativas >= maxTentativas) {
                    // Falha definitiva - mostrar erro na UI
                    console.error('Erro definitivo ao carregar histórico:', error);
                    const listaSessoes = document.getElementById('lista-sessoes');
                    if (listaSessoes) {
                        listaSessoes.innerHTML = `
                            <li class="sem-historico">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>Erro ao carregar histórico: ${error.message}</p>
                                <button onclick="carregarHistoricoSessoes()" class="retry-button">Tentar Novamente</button>
                            </li>
                        `;
                    }
                    return;
                }
                tentativas++;
            }
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

            const response = await fetch(`${API_BASE}/api/chat/historicos/${sessionMongoId}`, {
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

            // Verificar se temos um ID válido
            if (!sessionMongoId) {
                throw new Error('ID da sessão não disponível para gerar título');
            }

            console.log('Solicitando sugestão de título para sessão:', sessionMongoId);

            // Função para tentar gerar título com retry
            const tentarGerarTitulo = async (tentativas = 0) => {
                const maxTentativas = 3;
                try {
                    tentativas++;
                    console.log(`Tentativa ${tentativas} de gerar título...`);
                    
                    const respSugestao = await fetch(`${API_BASE}/api/chat/historicos/${sessionMongoId}/gerar-titulo`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (respSugestao.ok) {
                        const { tituloSugerido } = await respSugestao.json();
                        console.log('Título sugerido recebido:', tituloSugerido);
                        
                        if (!tituloSugerido || !tituloSugerido.trim()) {
                            throw new Error('Nenhum título foi sugerido pelo sistema');
                        }
                        
                        return tituloSugerido;
                    } else if (respSugestao.status === 503 && tentativas < maxTentativas) {
                        console.log('Servidor indisponível (503), tentando novamente...');
                        await new Promise(resolve => setTimeout(resolve, 2000 * tentativas)); // Delay progressivo
                        return tentarGerarTitulo(tentativas); // Tentar novamente
                    } else {
                        let mensagem = 'Falha ao gerar título.';
                        try {
                            const erro = await respSugestao.json();
                            mensagem = erro.error || erro.message || mensagem;
                        } catch (parseError) {
                            mensagem = `Erro ${respSugestao.status}: ${respSugestao.statusText}`;
                        }
                        throw new Error(mensagem);
                    }
                } catch (error) {
                    if (tentativas >= maxTentativas) {
                        throw error;
                    }
                    console.log(`Tentativa ${tentativas} falhou, tentando novamente...`);
                    return tentarGerarTitulo(tentativas);
                }
            };

            // Gerar título com retry
            const tituloSugerido = await tentarGerarTitulo();

            // Permitir edição/confirmação
            const tituloFinal = prompt('Sugerimos este título para a conversa. Você pode editar antes de salvar:', tituloSugerido);
            if (tituloFinal === null) {
                console.log('Usuário cancelou a geração de título');
                return; // cancelado pelo usuário
            }
            
            const tituloAjustado = String(tituloFinal).trim();
            if (!tituloAjustado) {
                alert('Título inválido. O título não pode estar vazio. Operação cancelada.');
                return;
            }

            console.log('Salvando título:', tituloAjustado);

            // Função para tentar salvar título com retry
            const tentarSalvarTitulo = async (tentativas = 0) => {
                const maxTentativas = 3;
                try {
                    tentativas++;
                    console.log(`Tentativa ${tentativas} de salvar título...`);
                    
                    const respSalvar = await fetch(`${API_BASE}/api/chat/historicos/${sessionMongoId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ titulo: tituloAjustado })
                    });

                    if (respSalvar.ok) {
                        const atualizado = await respSalvar.json();
                        console.log('Título salvo com sucesso:', atualizado);
                        return atualizado;
                    } else if (respSalvar.status === 503 && tentativas < maxTentativas) {
                        console.log('Servidor indisponível (503), tentando novamente...');
                        await new Promise(resolve => setTimeout(resolve, 2000 * tentativas)); // Delay progressivo
                        return tentarSalvarTitulo(tentativas); // Tentar novamente
                    } else {
                        let mensagem = 'Falha ao salvar título.';
                        try {
                            const erro = await respSalvar.json();
                            mensagem = erro.error || erro.message || mensagem;
                        } catch (parseError) {
                            mensagem = `Erro ${respSalvar.status}: ${respSalvar.statusText}`;
                        }
                        throw new Error(mensagem);
                    }
                } catch (error) {
                    if (tentativas >= maxTentativas) {
                        throw error;
                    }
                    console.log(`Tentativa ${tentativas} falhou, tentando novamente...`);
                    return tentarSalvarTitulo(tentativas);
                }
            };

            // Salvar título com retry
            const atualizado = await tentarSalvarTitulo();

            // Atualizar a UI
            const spanTitulo = elementoLi.querySelector('.sessao-titulo');
            if (spanTitulo) {
                spanTitulo.textContent = (atualizado && atualizado.titulo) ? atualizado.titulo : tituloAjustado;
            }

            // Mostrar confirmação
            console.log('Título gerado e salvo com sucesso:', tituloAjustado);
            
        } catch (error) {
            console.error('Erro ao gerar/salvar título:', error);
            
            // Tratamento específico para erro 503
            if (error.message.includes('503')) {
                alert('Servidor temporariamente indisponível. Tente novamente em alguns instantes ou use o botão de histórico para recarregar.');
                
                // Tentar recarregar o histórico para verificar status
                setTimeout(() => {
                    console.log('Tentando recarregar histórico...');
                    carregarHistoricoSessoes();
                }, 3000);
            } else {
                alert(`Erro ao gerar ou salvar o título: ${error.message}. Tente novamente.`);
            }
        } finally {
            if (botaoAcionador) {
                botaoAcionador.disabled = false;
                botaoAcionador.textContent = textoOriginalBotao || '✨';
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
        const startTime = Date.now();
        try {
            if (!backendOnline) {
                // Tentar checar status rapidamente antes de falhar
                await verificarStatusServidor();
                if (!backendOnline) {
                    throw Object.assign(new Error('Servidor offline. Tente novamente em alguns segundos.'), { type: 'network_error' });
                }
            }
            console.log('Enviando mensagem para o servidor:', message);
            console.log('Histórico atual:', chatHistory);
            
            // Atualizar indicador de tempo
            if (responseTimeIndicator.style.display !== 'none') {
                responseTimeIndicator.textContent = 'Conectando ao servidor...';
            }
            
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    history: chatHistory,
                    sessionId: sessionId
                }),
            });

            console.log('Resposta do servidor:', response.status);
            const data = await response.json();
            console.log('Dados recebidos do servidor:', data);

            if (!response.ok) {
                console.error('Erro na resposta do servidor:', data);
                throw new Error(data.details || data.error || 'Erro desconhecido');
            }

            // Calcular tempo de resposta
            const responseTime = Date.now() - startTime;
            console.log(`Tempo de resposta: ${responseTime}ms`);

            // Atualizar histórico
            chatHistory = data.history;
            console.log('Histórico atualizado:', chatHistory);

            // Persistir sessionId retornado pelo servidor
            if (data.sessionId && data.sessionId !== sessionId) {
                sessionId = data.sessionId;
                localStorage.setItem('chat_session_id', sessionId);
            }
            
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

            const response = await fetch(`${API_BASE}/api/log-connection`, {
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

            const response = await fetch(`${API_BASE}/api/ranking/registrar-acesso-bot`, {
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
            
            const responseLog = await fetch(`${API_BASE}/api/log-connection`, {
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

    // Inicialização: aguardar backend ficar online antes das chamadas iniciais
    (async () => {
        // Tentativas rápidas de verificar status na inicialização
        const maxTentativas = 15;
        let tentativa = 0;
        while (tentativa < maxTentativas) {
            tentativa++;
            const status = await verificarStatusServidor();
            if (status) break;
            await new Promise(r => setTimeout(r, 2000));
        }
        if (backendOnline) {
            // Registrar acesso inicial quando online
            registrarConexaoUsuario('acesso_inicial_chatbot_Mari');
            registrarAcessoBotParaRanking();
        } else {
            console.warn('Backend não ficou online durante a inicialização. As chamadas serão tentadas quando o usuário interagir.');
        }
        // Agendar verificação periódica
        setInterval(verificarStatusServidor, 30000);
    })();

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

    // Painel Administrativo
    adminButton.addEventListener('click', () => {
        // Abrir painel administrativo em nova aba
        window.open('/admin', '_blank');
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

    // Botão de status do servidor
    const statusButton = document.getElementById('check-status-button');
    if (statusButton) {
        statusButton.addEventListener('click', verificarStatusServidor);
    }

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

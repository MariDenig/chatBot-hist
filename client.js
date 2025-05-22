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
        scrollToBottom();
    }

    function setLoading(isLoading) {
        isProcessing = isLoading;
        if (isLoading) {
            sendButton.disabled = true;
            sendButton.textContent = 'Enviando...';
            typingIndicator.style.display = 'block';
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

    function updateHistoryModal() {
        historyContent.innerHTML = '';
        
        if (conversationHistory.length === 0) {
            const noHistory = document.createElement('div');
            noHistory.className = 'no-history';
            noHistory.textContent = 'Nenhuma conversa encontrada';
            historyContent.appendChild(noHistory);
            return;
        }
        
        conversationHistory.forEach((conversation, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date(conversation.timestamp).toLocaleString();
            
            const messages = document.createElement('div');
            messages.className = 'messages';
            
            conversation.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.isUser ? 'user-message' : 'bot-message'}`;
                
                if (msg.isUser) {
                    messageDiv.textContent = msg.text;
                } else {
                    messageDiv.appendChild(formatMessage(msg.text));
                }
                
                messages.appendChild(messageDiv);
            });
            
            historyItem.appendChild(timestamp);
            historyItem.appendChild(messages);
            historyContent.appendChild(historyItem);
        });
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
            
            const response = await fetch('/chat', {
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
        } catch (error) {
            console.error('Erro detalhado ao enviar mensagem:', error);
            console.error('Stack trace:', error.stack);
            handleError(error, error.type || 'api_error');
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage() {
        if (isProcessing) return;
        
        const message = userInput.value.trim();
        if (!message) return;

        // Mostrar mensagem do usuário
        addMessage(message, true);
        userInput.value = '';
        setLoading(true);

        // Processar a mensagem
        processBotRequest(message);
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

app.post('/chat', (req, res) => {
    const { message } = req.body;
    if (/que horas|horário|hora/i.test(message)) {
        // Horário do servidor (UTC por padrão no Render)
        const now = new Date();
        // Ajuste para o fuso desejado, se necessário
        const horaServidor = now.toLocaleString('pt-BR', { timeZone: 'UTC' });
        return res.json({
            response: `O horário atual do servidor é: ${horaServidor}`,
            history: req.body.history || []
        });
    }
    // ...processamento normal do bot...
});
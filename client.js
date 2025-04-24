document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    let chatHistory = []; // Armazenar o histórico da conversa

    // Criar indicador de digitação
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingIndicator);

    function addMessage(message, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : isError ? 'error-message' : 'bot-message'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function setLoading(isLoading) {
        if (isLoading) {
            sendButton.disabled = true;
            sendButton.textContent = 'Enviando...';
            typingIndicator.style.display = 'block';
        } else {
            sendButton.disabled = false;
            sendButton.textContent = 'Enviar';
            typingIndicator.style.display = 'none';
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Mostrar mensagem do usuário
        addMessage(message, true);
        userInput.value = '';
        setLoading(true);

        try {
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro desconhecido');
            }

            // Atualizar histórico
            chatHistory = data.history;
            
            // Mostrar resposta do bot
            addMessage(data.response);
        } catch (error) {
            console.error('Erro:', error);
            addMessage(error.message || 'Desculpe, ocorreu um erro ao processar sua mensagem.', false, true);
        } finally {
            setLoading(false);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !sendButton.disabled) {
            sendMessage();
        }
    });

    // Focar no input ao carregar a página
    userInput.focus();
}); 
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `<p>${message}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Respostas pré-definidas
        if (message.includes('brasil') || message.includes('brasileira')) {
            return "A história do Brasil é rica e diversa, começando com os povos indígenas, passando pela colonização portuguesa em 1500, o período imperial, a proclamação da República em 1889, e os diversos períodos políticos até os dias atuais.";
        } else if (message.includes('guerra') || message.includes('conflito')) {
            return "As guerras e conflitos ao longo da história moldaram o mundo como o conhecemos. Alguns dos mais significativos incluem a Primeira e Segunda Guerra Mundial, a Guerra Fria, e diversos conflitos regionais que impactaram a geopolítica global.";
        } else if (message.includes('antiga') || message.includes('civilização')) {
            return "As civilizações antigas, como Egito, Grécia, Roma, Mesopotâmia e China, foram fundamentais para o desenvolvimento da humanidade, contribuindo com avanços em diversas áreas como arquitetura, matemática, filosofia e governo.";
        } else if (message.includes('revolução') || message.includes('revolução')) {
            return "As revoluções foram momentos cruciais na história, como a Revolução Francesa (1789), que trouxe ideais de liberdade e igualdade, e a Revolução Industrial, que transformou a sociedade e a economia global.";
        } else if (message.includes('independência')) {
            return "A independência do Brasil foi proclamada em 7 de setembro de 1822 por Dom Pedro I, marcando o fim do período colonial e o início do Império Brasileiro.";
        } else {
            return "Desculpe, não entendi sua pergunta. Você pode me perguntar sobre história do Brasil, guerras, civilizações antigas, revoluções ou independência?";
        }
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Adiciona a mensagem do usuário
        addMessage(message, true);
        userInput.value = '';

        // Mostra indicador de digitação
        const typingIndicator = showTypingIndicator();

        // Simula um delay para parecer mais natural
        setTimeout(() => {
            removeTypingIndicator(typingIndicator);
            const botResponse = getBotResponse(message);
            addMessage(botResponse);
        }, 1000);
    }

    // Adiciona indicador de digitação
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.innerHTML = '<p>Digitando...</p>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    // Remove indicador de digitação
    function removeTypingIndicator(typingDiv) {
        typingDiv.remove();
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}); 
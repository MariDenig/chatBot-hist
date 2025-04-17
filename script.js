document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const historyButton = document.getElementById('history-button');
    let chatHistory = [];

    // Respostas pré-definidas
    const responses = {
        // Cumprimentos
        'bom dia': 'Bom dia! Como posso ajudar você com história hoje?',
        'boa tarde': 'Boa tarde! Em que posso ajudar com história?',
        'boa noite': 'Boa noite! Estou aqui para ajudar com suas dúvidas sobre história.',
        'oi': 'Olá! Sou seu assistente de história. Como posso ajudar?',
        'olá': 'Olá! Estou aqui para responder suas perguntas sobre história.',
        'tudo bem': 'Tudo ótimo! E com você? Como posso ajudar com história hoje?',
        'como vai': 'Estou muito bem, obrigado! Pronto para ajudar com suas dúvidas sobre história.',
        
        // História do Brasil
        'brasil': `A história do Brasil é fascinante! Vamos conhecer alguns momentos importantes:

1. Período Pré-Colonial (até 1500):
   - Habitado por diversos povos indígenas
   - Culturas ricas e diversificadas
   - Organização social complexa

2. Período Colonial (1500-1822):
   - Chegada dos portugueses em 1500
   - Ciclo do açúcar
   - Descoberta do ouro em Minas Gerais
   - Inconfidência Mineira (1789)

3. Período Imperial (1822-1889):
   - Independência em 1822
   - Primeiro e Segundo Reinado
   - Abolição da escravidão (1888)
   - Proclamação da República (1889)

4. República (1889-atual):
   - República Velha
   - Era Vargas
   - Regime Militar
   - Redemocratização

Gostaria de saber mais sobre algum período específico?`,

        // Guerras
        'guerra': `As guerras foram momentos cruciais na história mundial. Vamos conhecer algumas:

1. Primeira Guerra Mundial (1914-1918):
   - Conflito global
   - Tríplice Entente vs Tríplice Aliança
   - Novas tecnologias de guerra
   - Tratado de Versalhes

2. Segunda Guerra Mundial (1939-1945):
   - Eixo vs Aliados
   - Holocausto
   - Bomba atômica
   - Criação da ONU

3. Guerra Fria (1947-1991):
   - EUA vs URSS
   - Corrida espacial
   - Guerra do Vietnã
   - Queda do Muro de Berlim

4. Guerras no Brasil:
   - Guerra do Paraguai (1864-1870)
   - Revolução de 1930
   - Revolução Constitucionalista de 1932

Qual guerra você gostaria de conhecer melhor?`,

        // Civilizações Antigas
        'antiga': `As civilizações antigas foram fundamentais para o desenvolvimento humano. Conheça algumas:

1. Egito Antigo (3100 a.C. - 332 a.C.):
   - Pirâmides e esfinges
   - Escrita hieroglífica
   - Faraós e deuses
   - Medicina avançada

2. Grécia Antiga (800 a.C. - 146 a.C.):
   - Berço da democracia
   - Filosofia e ciência
   - Mitologia grega
   - Jogos Olímpicos

3. Roma Antiga (753 a.C. - 476 d.C.):
   - Império Romano
   - Direito romano
   - Gladiadores
   - Arquitetura inovadora

4. Mesopotâmia:
   - Primeira escrita (cuneiforme)
   - Código de Hamurábi
   - Jardins Suspensos
   - Zigurates

Qual civilização te interessa mais?`,

        // Revoluções
        'revolução': `As revoluções transformaram o mundo. Vamos conhecer algumas:

1. Revolução Francesa (1789-1799):
   - Queda da Bastilha
   - Declaração dos Direitos do Homem
   - Napoleão Bonaparte
   - Influência mundial

2. Revolução Industrial (século XVIII-XIX):
   - Máquina a vapor
   - Urbanização
   - Capitalismo
   - Mudanças sociais

3. Revoluções no Brasil:
   - Revolução de 1930
   - Revolução Constitucionalista
   - Revolução de 1964
   - Diretas Já

4. Revolução Russa (1917):
   - Socialismo
   - Lênin
   - URSS
   - Guerra Civil

Qual revolução você quer conhecer melhor?`,

        // Independência
        'independência': `A independência do Brasil foi um processo complexo:

1. Antecedentes:
   - Revolução do Porto (1820)
   - Dia do Fico (9 de janeiro de 1822)
   - Pressão das cortes portuguesas

2. Processo de Independência:
   - Grito do Ipiranga (7 de setembro de 1822)
   - Dom Pedro I como imperador
   - Reconhecimento internacional
   - Constituição de 1824

3. Consequências:
   - Manutenção da monarquia
   - Dívida com Portugal
   - Centralização do poder
   - Primeiro Reinado

Gostaria de saber mais sobre algum aspecto específico da independência?`
    };

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        // Formatar mensagens com quebras de linha
        const formattedMessage = message.split('\n').map(line => `<p>${line}</p>`).join('');
        messageDiv.innerHTML = formattedMessage;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Salvar no histórico
        chatHistory.push({ role: isUser ? 'user' : 'bot', content: message });
    }

    function getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Verificar palavras-chave
        for (const [key, response] of Object.entries(responses)) {
            if (message.includes(key)) {
                return response;
            }
        }
        
        return "Desculpe, não entendi sua pergunta. Você pode me perguntar sobre:\n" +
               "- História do Brasil\n" +
               "- Guerras e conflitos\n" +
               "- Civilizações antigas\n" +
               "- Revoluções históricas\n" +
               "- Independência do Brasil\n\n" +
               "Ou pode me cumprimentar com 'bom dia', 'boa tarde' ou 'boa noite'!";
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Adiciona a mensagem do usuário
        addMessage(message, true);
        userInput.value = '';

        // Mostra indicador de digitação
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        typingIndicator.innerHTML = '<p>Digitando...</p>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Simula processamento
        setTimeout(() => {
            typingIndicator.remove();
            const botResponse = getBotResponse(message);
            addMessage(botResponse);
        }, 1000);
    }

    function showHistory() {
        const historyDiv = document.createElement('div');
        historyDiv.className = 'history-container';
        
        let historyContent = '<div class="history-header">';
        historyContent += '<h3><i class="fas fa-history"></i> Histórico</h3>';
        historyContent += '<button class="clear-history"><i class="fas fa-trash"></i> Limpar</button>';
        historyContent += '</div>';
        
        historyContent += '<div class="history-messages">';
        if (chatHistory.length === 0) {
            historyContent += '<p class="no-history">Nenhuma conversa registrada</p>';
        } else {
            chatHistory.forEach(msg => {
                historyContent += `
                    <div class="history-message ${msg.role}">
                        <div class="message-header">
                            <strong>${msg.role === 'user' ? 'Você' : 'Bot'}</strong>
                        </div>
                        <p>${msg.content}</p>
                    </div>
                `;
            });
        }
        historyContent += '</div>';
        
        historyContent += '<div class="history-footer">';
        historyContent += '<button class="close-history"><i class="fas fa-times"></i> Fechar</button>';
        historyContent += '</div>';
        
        historyDiv.innerHTML = historyContent;
        document.body.appendChild(historyDiv);
        
        // Event listeners
        const closeButton = historyDiv.querySelector('.close-history');
        const clearButton = historyDiv.querySelector('.clear-history');
        
        closeButton.addEventListener('click', () => {
            historyDiv.remove();
        });
        
        clearButton.addEventListener('click', () => {
            chatHistory = [];
            historyDiv.querySelector('.history-messages').innerHTML = '<p class="no-history">Nenhuma conversa registrada</p>';
        });
    }

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    historyButton.addEventListener('click', showHistory);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Focar no input quando a página carregar
    userInput.focus();
}); 
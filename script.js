// Função para testar o registro de log
async function testarRegistroLog() {
    try {
        const response = await fetch('https://chatbot-historia.onrender.com/api/log-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ip: '127.0.0.1',
                acao: 'teste_botao',
                nomeBot: 'chatbot-historia'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Log registrado com sucesso!');
            console.log('Resposta do servidor:', data);
        } else {
            alert('Erro ao registrar log: ' + data.error);
            console.error('Erro:', data);
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor: ' + error.message);
        console.error('Erro:', error);
    }
}

// Adicionar o evento de clique ao botão quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {

    testarRegistroLog();
    const testLogButton = document.getElementById('testLogButton');
    if (testLogButton) {
        testLogButton.addEventListener('click', testarRegistroLog);
    }
}); 
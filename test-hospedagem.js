#!/usr/bin/env node

/**
 * Script de teste para verificar funcionalidades na hospedagem
 * Execute: node test-hospedagem.js
 */

const BASE_URL = 'https://chatbot-historia.onrender.com';

async function testEndpoint(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        console.log(`\n🔍 Testando: ${method} ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Sucesso:`, data);
            return { success: true, data };
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log(`❌ Erro:`, errorData);
            return { success: false, error: errorData };
        }
    } catch (error) {
        console.log(`💥 Exceção:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Iniciando testes de hospedagem...');
    console.log(`📍 URL base: ${BASE_URL}`);
    
    // Teste 1: Status do servidor
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 1: Status do Servidor');
    console.log('='.repeat(50));
    await testEndpoint('/status');
    
    // Teste 2: Conexão MongoDB
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 2: Conexão MongoDB');
    console.log('='.repeat(50));
    await testEndpoint('/test-mongo');
    
    // Teste 3: Funcionalidades
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 3: Funcionalidades');
    console.log('='.repeat(50));
    await testEndpoint('/test-functions');
    
    // Teste 4: Chat básico
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 4: Chat Básico');
    console.log('='.repeat(50));
    await testEndpoint('/chat', 'POST', {
        message: 'Olá, teste de hospedagem',
        history: [],
        sessionId: `test_${Date.now()}`
    });
    
    // Teste 5: Históricos
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 5: Históricos');
    console.log('='.repeat(50));
    await testEndpoint('/api/chat/historicos');
    
    // Teste 6: Logs
    console.log('\n' + '='.repeat(50));
    console.log('TESTE 6: Logs');
    console.log('='.repeat(50));
    await testEndpoint('/api/logs');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TESTES CONCLUÍDOS');
    console.log('='.repeat(50));
    console.log('\n📋 Resumo dos problemas encontrados:');
    console.log('1. Verifique se o MongoDB está conectando');
    console.log('2. Verifique se as APIs estão configuradas');
    console.log('3. Verifique os logs do servidor');
    console.log('4. Teste manualmente no navegador');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };

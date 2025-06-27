const fs = require('fs');
const path = require('path');
require('dotenv').config();

const envPath = path.join(__dirname, '.env');

console.log('=== Teste de Leitura do .env ===');
console.log('Caminho do arquivo:', envPath);
console.log('Arquivo existe?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log('\nConteúdo do arquivo:');
    console.log(fs.readFileSync(envPath, 'utf8'));
}

console.log('\nVariáveis carregadas:');
console.log('MONGO_URI_mari:', process.env.MONGO_URI_mari ? 'Definida' : 'Não definida');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Definida' : 'Não definida');
console.log('NODE_ENV:', process.env.NODE_ENV); 
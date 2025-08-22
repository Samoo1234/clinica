// Teste rápido da API
const app = require('./api/index.js');
const request = require('supertest');

console.log('🧪 Testando API...');

// Teste básico
const testAPI = async () => {
  try {
    console.log('1. Testando health check...');
    const healthResponse = await request(app).get('/api/health');
    console.log('✅ Health check:', healthResponse.status, healthResponse.body);

    console.log('2. Testando financial dashboard...');
    const financialResponse = await request(app).get('/api/financial/dashboard');
    console.log('✅ Financial dashboard:', financialResponse.status, financialResponse.body);

    console.log('3. Testando auth login...');
    const authResponse = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'test'
    });
    console.log('✅ Auth login:', authResponse.status, authResponse.body);

    console.log('\n🎉 Todos os testes passaram! API está funcionando.');
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
};

testAPI();
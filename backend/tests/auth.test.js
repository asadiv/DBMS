const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {

  // ─── Register Tests ───────────────────────────────────
  describe('POST /api/auth/register', () => {

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser_jest',
          email: `jest_${Date.now()}@test.com`,
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('userID');
      expect(res.body.data.user.username).toBe('testuser_jest');
    });

    it('should fail if email is already registered', async () => {
      const email = `duplicate_${Date.now()}@test.com`;

      await request(app)
        .post('/api/auth/register')
        .send({ username: 'user1', email, password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'user2', email, password: 'password123' });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

  });

  // ─── Login Tests ───────────────────────────────────────
  describe('POST /api/auth/login', () => {

    it('should login successfully with correct credentials', async () => {
      const email = `login_${Date.now()}@test.com`;

      await request(app)
        .post('/api/auth/register')
        .send({ username: 'loginuser', email, password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail login with wrong password', async () => {
      const email = `wrongpass_${Date.now()}@test.com`;

      await request(app)
        .post('/api/auth/register')
        .send({ username: 'wrongpassuser', email, password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

  });

});

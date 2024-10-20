// tests/integration.test.js

import request from 'supertest';
import SapixServer from '../lib/server.js';
import SapixRoutes from '../lib/route.js';

// Setup the initial app and routes from Sapix
const routes = new SapixRoutes();

// Define your routes as per your application's configuration
routes.prefix('/api/v1').get('', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page! v1');
});

routes.get('/user');
routes.post('/user');
routes.patch('/user');
routes.delete('/user');

routes.prefix('/api/v2');
routes.get('/user/:id');
routes.post('/user');

routes.prefix('');
routes.get('/');

routes.get('/profile/:id/user/:userId');

// Additional Routes
routes.get('/product/:id'); // Assuming without datatype for simplicity
routes.get('/product/:id/user/:name'); // Assuming without datatype
routes.get('/user/:name');
routes.get('/product/:random'); // Assuming without datatype
routes.get('/profile/:id/:template/username/:username/age/:age');

const server = new SapixServer().setPort(3333).setRoutes(routes);

// Helper function to start and stop the server for tests
const startServer = () => server.start();
const stopServer = (app) => app.close();

// Define valid and invalid data for testing
const validData = {
  number: '123',
  string: 'JohnDoe',
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  version: '1.0.0',
  alphanumeric: 'abc123',
  boolean: 'true',
  date: '2023-10-20',
  phone: '123-456-7890',
  ip: '192.168.1.1',
  hex: '1a2b3c',
  slug: 'test-slug',
};

const invalidData = {
  number: 'abc', // Invalid number
  string: '123', // Valid as string but may be invalid based on context
  uuid: 'invalid-uuid',
  email: 'invalid-email',
  version: 'version',
  alphanumeric: '!@#$%', // Invalid alphanumeric
  boolean: 'not-boolean',
  date: '20-10-2023', // Invalid date format
  phone: 'phone-number',
  ip: '999.999.999.999', // Invalid IP
  hex: 'zzz', // Invalid hex
  slug: 'invalid slug!', // Invalid slug
};

// API Tests
describe('Sapix API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = startServer();
  });

  afterAll(() => {
    stopServer(app);
  });

  // Test the /api/v1 endpoint
  it('should return welcome message for /api/v1', async () => {
    const response = await request(app).get('/api/v1/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to sapixRoutes Home Page! v1');
  });

  /**
   * Tests for /product/:id
   */
  describe('GET /product/:id', () => {
    // Valid case
    it('should return 200 for valid number id', async () => {
      const response = await request(app).get(`/product/${validData.number}`);
      expect(response.status).toBe(200);
      // Add more assertions based on your route's response
    });

    // Invalid cases
    it('should return 200 for invalid string id', async () => {
      const response = await request(app).get(`/product/${invalidData.string}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for invalid uuid id', async () => {
      const response = await request(app).get(`/product/${invalidData.uuid}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for missing id', async () => {
      const response = await request(app).get(`/product/`);
      expect(response.status).toBe(204);
    });
  });

  /**
   * Tests for /product/:id/user/:name
   */
  describe('GET /product/:id/user/:name', () => {
    // Valid case
    it('should return 200 for valid number id and string name', async () => {
      const response = await request(app).get(`/product/${validData.number}/user/${validData.string}`);
      expect(response.status).toBe(200);
      // Add more assertions based on your route's response
    });

    // Invalid id cases
    it('should return 200 for invalid string id', async () => {
      const response = await request(app).get(`/product/${invalidData.string}/user/${validData.string}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for invalid uuid id', async () => {
      const response = await request(app).get(`/product/${invalidData.uuid}/user/${validData.string}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for missing id', async () => {
      const response = await request(app).get(`/product//user/${validData.string}`);
      expect(response.status).toBe(204);
    });

    // Invalid name cases
    it('should return 200 for invalid uuid name', async () => {
      const response = await request(app).get(`/product/${validData.number}/user/${invalidData.uuid}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for missing name', async () => {
      const response = await request(app).get(`/product/${validData.number}/user/`);
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    // Both parameters invalid
    it('should return 200 for invalid id and invalid name', async () => {
      const response = await request(app).get(`/product/${invalidData.string}/user/${invalidData.uuid}`);
      expect(response.status).toBe(200);
    });
  });

  /**
   * Tests for /user/:name
   */
  describe('GET /user/:name', () => {
    // Valid case
    it('should return 200 for valid string name', async () => {
      const response = await request(app).get(`/user/${validData.string}`);
      expect(response.status).toBe(200);
      expect(response.text).toBe("{\"query\":{},\"params\":{\"name\":\"JohnDoe\"},\"body\":{}}");
      // Add more assertions based on your route's response
    });

    // Invalid cases
    it('should return 200 for invalid number name', async () => {
      const response = await request(app).get(`/user/${invalidData.number}`);
      expect(response.status).toBe(200);
      expect(response.text).toBe("{\"query\":{},\"params\":{\"name\":\"abc\"},\"body\":{}}");
    });

    it('should return 200 for missing name', async () => {
      const response = await request(app).get(`/user/`);
      expect(response.status).toBe(204);
      expect(response.text).toBe('');

    });
  });

  /**
   * Tests for /product/:random
   */
  describe('GET /product/:random', () => {
    // Valid case
    it('should return 200 for valid alphanumeric random', async () => {
      const response = await request(app).get(`/product/${validData.alphanumeric}`);
      expect(response.status).toBe(200);
      // Add more assertions based on your route's response
    });

    // Invalid cases
    it('should return 200 for invalid number random', async () => {
      const response = await request(app).get(`/product/${invalidData.number}`);
      expect(response.status).toBe(200);
    });

    it('should return 200 for missing random', async () => {
      const response = await request(app).get(`/product/`);
      expect(response.status).toBe(204);
    });
  });

  /**
   * Tests for /profile/:id/:template/username/:username/age/:age
   */
  describe('GET /profile/:id/:template/username/:username/age/:age', () => {
    // Valid case
    it('should return 200 for all valid parameters', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
      // Add more assertions based on your route's response
    });

    // Invalid `id`
    it('should return 200 for invalid string id', async () => {
      const response = await request(app).get(
        `/profile/${invalidData.string}/${validData.string}/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null id', async () => {
      const response = await request(app).get(
        `/profile/${null}/${validData.string}/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    // Invalid `template`
    it('should return 200 for invalid number template', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/123/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null template', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${null}/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    // Invalid `username`
    it('should return 200 for invalid number username', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${invalidData.number}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null username', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${null}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    // Invalid `age`
    it('should return 200 for invalid string age', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${validData.string}/age/${invalidData.string}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null age', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${validData.string}/age/${null}`
      );
      expect(response.status).toBe(200);
    });

    // Multiple Invalid Parameters
    it('should return 200 for invalid id and age', async () => {
      const response = await request(app).get(
        `/profile/${invalidData.string}/${validData.string}/username/${validData.string}/age/${invalidData.string}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null id and template', async () => {
      const response = await request(app).get(
        `/profile/${null}/${null}/username/${validData.string}/age/${validData.number}`
      );
      expect(response.status).toBe(200);
    });

    it('should return 200 for null username and age', async () => {
      const response = await request(app).get(
        `/profile/${validData.number}/${validData.string}/username/${null}/age/${null}`
      );
      expect(response.status).toBe(200);
    });

    // All Parameters Invalid
    it('should return 200 for all parameters invalid', async () => {
      const response = await request(app).get(
        `/profile/${invalidData.string}/${invalidData.number}/username/${invalidData.number}/age/${invalidData.string}`
      );
      expect(response.status).toBe(200);
    });

    // Non existing one
    it('should return 200 for all parameters invalid', async () => {
      const response = await request(app).get(
        `/profile2/${invalidData.string}/${invalidData.number}/username/${invalidData.number}/age/${invalidData.string}`
      );
      expect(response.status).toBe(204);
    });
  });
});

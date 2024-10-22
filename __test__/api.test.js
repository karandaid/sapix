import request from 'supertest';
import SapixServer from '../lib/server.js';
import SapixRoutes from '../lib/route.js';

// Setup the initial app and routes from Sapix
const routes = new SapixRoutes();

routes.prefix('/api/v1').get('', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page! v1');
});

routes.get('/user', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page! v1');
});

routes.post('/user', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page!');
});

routes.prefix('/api/v2');
routes.get('/user/:id', (res, query, path_params, body) => {
  res.status(200).sendJSON({
    query,
    path_params,
    body,
  });
});

routes.post('/user', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page!');
});

routes.prefix('');
routes.get('/', (res) => {
  res.status(200).sendText('Welcome to sapixRoutes Home Page!');
});

routes.get('/profile/:id/user/:userId', (res, query, path_params) => {
  res.status(200).sendJSON({
    message: 'This is a JSON response.',
    query,
    path_params,
  });
});

routes.get('/profile/user/:userId', (res, query, path_params, body) => {
  res.status(200).sendJSON({
    query,
    path_params,
    body,
  });
});

routes.get('/profile', (res, query, path_params) => {
  res.status(200).sendJSON({
    message: 'This is a JSON response.',
    query,
    path_params,
  });
});

routes.post('/profile', (res) => {
  res.status(200).sendJSON({
    message: 'This is a JSON response.',
  });
});

routes.delete('/profile', (res) => {
  res.status(200).sendJSON({
    message: 'This is a JSON response for delete.',
  });
});

routes.patch('/profile', (res) => {
  res.status(200).sendJSON({
    message: 'This is a JSON response for Patch.',
  });
});

routes.get('/about', (res) => {
  res.status(200).sendHTML('<h1>Welcome!!!</h1>');
});

routes.get('/error', (res) => {
  res.sendError('Something went wrong!', 500);
});

const server = new SapixServer().setPort(3333).setRoutes(routes);

// API Tests
describe('Sapix API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = server.start();
  });

  afterAll(() => {
    app.close();
  });

  // Test the /api/v1 endpoint
  it('should return welcome message for /api/v1', async () => {
    const response = await request(app).get('/api/v1/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to sapixRoutes Home Page! v1');
  });

  // Test the /api/v1/user GET endpoint
  it('should return welcome message for /api/v1/user GET', async () => {
    const response = await request(app).get('/api/v1/user');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to sapixRoutes Home Page! v1');
  });

  // Test the /api/v1/user POST endpoint
  it('should return welcome message for /api/v1/user POST', async () => {
    const response = await request(app).post('/api/v1/user');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to sapixRoutes Home Page!');
  });

  // Test the /api/v2/user/:id GET endpoint
  it('should return user data for /api/v2/user/:id GET', async () => {
    const response = await request(app).get('/api/v2/user/123?name=John');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      query: { name: 'John' },
      path_params: { id: '123' },
      body: {},
    });
  });

  // Test the /api/v2/user POST endpoint
  it('should return welcome message for /api/v2/user POST', async () => {
    const response = await request(app).post('/api/v2/user');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to sapixRoutes Home Page!');
  });

  // Additional tests for sapixRoutes
  it('should return JSON response for /profile/:id/user/:userId GET', async () => {
    const response = await request(app).get('/profile/123/user/456');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'This is a JSON response.',
      query: {},
      path_params: { id: '123', userId: '456' },
    });
  });

  it('should return JSON response for /profile/user/:userId GET with body', async () => {
    const response = await request(app)
      .get('/profile/user/456')
      .send({ key: 'value' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      query: {},
      path_params: { userId: '456' },
      body: { key: 'value' },
    });
  });

  it('should return JSON response for /profile POST', async () => {
    const response = await request(app).post('/profile');
    expect(response.status).toBe(200);
  });

  it('should return JSON response for /profile DELETE', async () => {
    const response = await request(app).delete('/profile');
    expect(response.status).toBe(200);
    expect(response.text).toBe("{\"message\":\"This is a JSON response for delete.\"}");
  });

  it('should return JSON response for /profile PATCH', async () => {
    const response = await request(app).patch('/profile');
    expect(response.status).toBe(200);
    expect(response.text).toBe("{\"message\":\"This is a JSON response for Patch.\"}");
  });

  it('should return HTML for /about GET', async () => {
    const response = await request(app).get('/about');
    expect(response.status).toBe(200);
    expect(response.text).toBe('<h1>Welcome!!!</h1>');
  });

  it('should return error for /error GET', async () => {
    const response = await request(app).get('/error');
    expect(response.status).toBe(500);
    expect(response.text).toBe(JSON.stringify({
      "error": "Something went wrong!"
    }));
  });
});

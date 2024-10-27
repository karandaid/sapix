import request from 'supertest';
import { fileURLToPath } from 'url';
import path from 'path';
import Requests from '../lib/request.js'
import SapixServer from '../lib/server.js';
import SapixRoutes from '../lib/route.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup the initial app and routes from Sapix
const routes = new SapixRoutes();

routes.get('/test/query', (res) => {
    const req = new Requests(res.req)
    const query = req.getQuery();
    res.sendJSON(query);
});


routes.get('/test/header', (res) => {
    const req = new Requests(res.req)
    const header = req.getHeader('test-header');
    res.sendText(header);
});

routes.get('/test/method', (res) => {
    const req = new Requests(res.req)
    res.sendText(req.getMethod());
});

routes.get('/test/secure', (res) => {
    const req = new Requests(res.req)
    res.sendJSON({ isSecure: req.isSecure() });
});

routes.get('/test/ip', (res) => {
    const req = new Requests(res.req)
    res.sendText(req.getClientIP());
});

routes.get('/test/content-type', (res) => {
    const req = new Requests(res.req)
    res.sendText(req.getContentType());
});

// Start the server with routes
const server = new SapixServer().setPort(3333).setRoutes(routes);

// API Tests
describe('request.test: Request Class Function Tests', () => {
    let app;

    beforeAll(() => {
        app = server.start();
    });

    afterAll(() => {
        app.close();
    });

    // Test for getQuery method
    it('request.test: should return query parameters for /test/query', async () => {
        const response = await request(app).get('/test/query?name=John&age=30');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ name: 'John', age: '30' });
    });

    // Test for getHeader method
    it('request.test: should return specific header for /test/header', async () => {
        const response = await request(app)
            .get('/test/header')
            .set('Test-Header', 'TestValue');
        expect(response.status).toBe(200);
        expect(response.text).toBe('TestValue');
    });

    // Test for getMethod method
    it('request.test: should return request method for /test/method', async () => {
        const response = await request(app).get('/test/method');
        expect(response.status).toBe(200);
        expect(response.text).toBe('GET');
    });

    // Test for isSecure method
    it('request.test: should return isSecure as false for HTTP request', async () => {
        const response = await request(app).get('/test/secure');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ isSecure: false });
    });

    // Test for getClientIP method
    it('request.test: should return client IP address for /test/ip', async () => {
        const response = await request(app).get('/test/ip').set('X-Forwarded-For', '192.168.1.1');
        expect(response.status).toBe(200);
        expect(response.text).toBe('192.168.1.1');
    });

    // Test for getContentType method
    it('request.test: should return content type for /test/content-type', async () => {
        const response = await request(app)
            .get('/test/content-type')
            .set('Content-Type', 'application/json');
        expect(response.status).toBe(200);
        expect(response.text).toBe('application/json');
    });
});

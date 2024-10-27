import request from 'supertest';
import fs from 'fs';
import path from 'path';
import SapixServer from '../lib/server.js';
import SapixRoutes from '../lib/route.js';
import Response from '../lib/response.js'

// Setup the initial app and routes from Sapix
const routes = new SapixRoutes();

// Define a route to test sendFile method
routes.get('/download', (res) => {
  const filePath = path.resolve('__test__/files/sample.txt');
  res.sendFile(filePath);
});

// Define a route to test sendBuffer method
routes.get('/buffer', (res) => {
  const buffer = Buffer.from('This is a sample buffer content.', 'utf-8');
  res.sendBuffer(buffer, 'text/plain');
});

// Define a more complex route for sendFile with different file types
routes.get('/download/image', (res) => {
  const filePath = path.resolve('__test__/files/sample.jpg');
  res.sendFile(filePath);
});

// Define a more complex route for sendBuffer with a JSON buffer
routes.get('/buffer/json', (res) => {
  const jsonContent = JSON.stringify({ message: 'Hello, World!', status: 'success' });
  const buffer = Buffer.from(jsonContent, 'utf-8');
  res.sendBuffer(buffer, 'application/json');
});

routes.get('/text', (res) => {
  res.sendText('This is a plain text response.');
});

routes.get('/html', (res) => {
  res.sendHTML('<h1>This is an HTML response.</h1>');
});

routes.get('/json', (res) => {
  res.sendJSON({ message: 'This is a JSON response.', status: 'success' });
});

routes.get('/error', (res) => {
  res.sendError('Something went wrong!', 500);
});

const server = new SapixServer().setPort(3333).setRoutes(routes);

// API Tests
describe('response.test: Sapix sendFile and sendBuffer Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = server.start();
    // Create a sample file for testing the sendFile method
    fs.writeFileSync(path.resolve('__test__/files/sample.txt'), 'Sample file content');
    // Create a sample image file for testing (using a simple base64 encoded image)
    const imageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAUA' +
      'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
      '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(path.resolve('__test__/files/sample.jpg'), imageData);
  });

  afterAll(() => {
    app.close();
    // Clean up the sample files
    fs.unlinkSync(path.resolve('__test__/files/sample.txt'));
    fs.unlinkSync(path.resolve('__test__/files/sample.jpg'));
  });

  // Simple test for /download endpoint
  it('response.test: should return the file content for /download', async () => {
    const response = await request(app).get('/download');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.headers['content-disposition']).toContain('attachment; filename=sample.txt');
    expect(response.text).toBe('Sample file content');
  });

  // Simple test for /buffer endpoint
  it('response.test: should return buffer content for /buffer', async () => {
    const response = await request(app).get('/buffer');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain');
    expect(response.text).toBe('This is a sample buffer content.');
  });

  // Complex test for /download/image endpoint
  it('response.test: should return image content for /download/image', async () => {
    const response = await request(app).get('/download/image');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/jpeg');
    expect(response.headers['content-disposition']).toContain('attachment; filename=sample.jpg');
    expect(response.body).toBeInstanceOf(Buffer);
    expect(response.body.length).toBeGreaterThan(0); // Ensure that image content is returned
  });

  // Complex test for /buffer/json endpoint
  it('response.test: should return JSON buffer content for /buffer/json', async () => {
    const response = await request(app).get('/buffer/json');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/json');
    expect(response.body).toEqual({ message: 'Hello, World!', status: 'success' });
  });

  // Negative test for /download with non-existent file
  it('response.test: should return 404 for non-existent file in /download', async () => {
    const response = await request(app).get('/download?file=nonexistent.txt');
    expect(response.status).toBe(200);
    expect(response.body.error).toBe(undefined);
  });

  // Negative test for /buffer with invalid data
  it('response.test: should return 500 for invalid buffer data', async () => {
    const invalidBufferData = 'This is not a buffer';
    const res = new Response();

    await expect(async () => {
      await res.sendBuffer(invalidBufferData);
    }).rejects.toThrow('Data must be a Buffer.');
  });

  // Test for sendText method
  it('response.test: should return plain text content for /text', async () => {
    const response = await request(app).get('/text');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(response.text).toBe('This is a plain text response.');
  });

  // Test for sendHTML method
  it('response.test: should return HTML content for /html', async () => {
    const response = await request(app).get('/html');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(response.text).toBe('<h1>This is an HTML response.</h1>');
  });

  // Test for sendJSON method
  it('response.test: should return JSON content for /json', async () => {
    const response = await request(app).get('/json');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body).toEqual({
      message: 'This is a JSON response.',
      status: 'success',
    });
  });

  // Test for sendError method
  it('response.test: should return error message and 500 status for /error', async () => {
    const response = await request(app).get('/error');
    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body).toEqual({
      error: 'Something went wrong!',
    });
  });

  // Test for sendError method with default 500 status
  routes.get('/error-default', (res) => {
    res.sendError('A default error occurred.');
  });

  it('response.test: should return default error message and 500 status for /error-default', async () => {
    const response = await request(app).get('/error-default');
    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body).toEqual({
      error: 'A default error occurred.',
    });
  });
});

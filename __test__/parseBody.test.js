import parseBody from '../lib/utils/parser.mjs';
import { Readable } from 'stream';

describe('parseBody', () => {
  test('parses JSON correctly', async () => {
    const body = '{"name": "John"}';
    const result = await parseBody(body, 'application/json');
    expect(result).toEqual({ name: 'John' });
  });

  test('throws error on invalid JSON', async () => {
    const body = '{"name": John}';
    await expect(parseBody(body, 'application/json')).rejects.toThrow('Invalid JSON format');
  });

  test('parses XML correctly', async () => {
    const body = '<person><name>John</name></person>';
    const result = await parseBody(body, 'application/xml');
    expect(result).toEqual({ person: { name: 'John' } });
  });

  test('throws error on invalid XML', async () => {
    const body = '<person><name>John</name>';
    await expect(parseBody(body, 'application/xml')).rejects.toThrow('Invalid XML format');
  });

  test('parses YAML correctly', async () => {
    const body = 'name: John';
    const result = await parseBody(body, 'application/x-yaml');
    expect(result).toEqual({ name: 'John' });
  });

  test('throws error on invalid YAML', async () => {
    const body = ': name John';
    await expect(parseBody(body, 'application/x-yaml')).rejects.toThrow('Invalid YAML format');
  });

  test('parses CSV correctly', async () => {
    const body = 'name,age\nJohn,30';
    const result = await parseBody(body, 'text/csv');
    expect(result).toEqual([{ name: 'John', age: '30' }]);
  });

  test('parses plain text correctly', async () => {
    const body = 'Hello, World!';
    const result = await parseBody(body, 'text/plain');
    expect(result).toBe('Hello, World!');
  });

  test('parses URL-encoded form data correctly', async () => {
    const body = 'name=John&age=30';
    const result = await parseBody(body, 'application/x-www-form-urlencoded');
    expect(result).toEqual({ name: 'John', age: '30' });
  });

  test('parses GraphQL JSON correctly', async () => {
    const body = '{"query": "{ user { name } }"}';
    const result = await parseBody(body, 'application/graphql');
    expect(result).toEqual({ query: '{ user { name } }' });
  });

  test('throws error on invalid GraphQL JSON', async () => {
    const body = '{query: { user { name } }}';
    await expect(parseBody(body, 'application/graphql')).rejects.toThrow('Invalid GraphQL format');
  });

  test('parses binary data correctly', async () => {
    const body = 'Hello';
    const result = await parseBody(body, 'application/octet-stream');
    expect(result).toEqual(Buffer.from(body, 'binary'));
  });

  test('throws error on unsupported content type', async () => {
    const body = '{}';
    await expect(parseBody(body, 'unsupported/type')).rejects.toThrow('Unsupported content type: unsupported/type');
  });

  test('throws error on malformed multipart/form-data', async () => {
    const req = createMockRequest(
      '--boundary\r\n' +
      'Content-Disposition: form-data; name="name"\r\n' +
      '\r\n' +
      'John\r\n' +
      '--boundary',
      'multipart/form-data; boundary=boundary'
    );

    await expect(parseBody(null, 'multipart/form-data', req)).rejects.toThrow('Unsupported content type: multipart/form-data');
  });

});

// Helper function to create a mock request for multipart/form-data
function createMockRequest(body, contentType) {
  const req = new Readable({
      read() {
          this.push(body);
          this.push(null);
      }
  });
  req.headers = {
      'content-type': contentType,
      'content-length': Buffer.byteLength(body),
  };
  return req;
}

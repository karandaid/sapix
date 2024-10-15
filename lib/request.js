import url from 'url'
import parserBody from './utils/parser.mjs'

class Request {
  constructor(req) {
    this.req = req;
    const { query, pathname } = url.parse(req.url, true);
    this.query = query;
    this.pathname = pathname;
  }

  // Get the full request URL
  getFullUrl() {
    return `${this.req.headers.host}${this.req.url}`;
  }

  // Get a specific query parameter or all query parameters
  getQuery(key = null) {
    return key ? this.query[key] : this.query;
  }

  // Extract a path parameter by its index (assuming `/path/:param1/:param2` style paths)
  getPathParam(index) {
    const pathParts = this.pathname.split('/').filter(Boolean);
    return pathParts[index] || null;
  }

  // Get a specific header or all headers
  getHeader(key = null) {
    return key ? this.req.headers[key.toLowerCase()] : this.req.headers;
  }

  // Get the HTTP method (GET, POST, etc.)
  getMethod() {
    return this.req.method;
  }
  
  // Get the request body (works only if body is already parsed)
  getBody() {
    return new Promise((resolve, reject) => {
      let body = '';

      this.req.on('data', (chunk) => {
        body += chunk; // Collect data chunks
      });

      this.req.on('end', async () => {
        try {
          let parsedBody;
          const contentType = this.req.headers['content-type'] || '';

          console.log(contentType)
          parsedBody = await parserBody(body, contentType)
          console.log('parsedBody', parsedBody)

          resolve(parsedBody);
        } catch (err) {
          console.error('JSON Parse Error:', err);
          resolve({ error: true, message: 'Invalid JSON', details: err.message });
        }
      });

      this.req.on('error', (err) => {
        console.error('Request Error:', err);
        resolve({ error: true, message: 'Something Wrong', details: err.message });
      });
    });
  }

  // Check if the request is secure (HTTPS)
  isSecure() {
    return this.req.connection.encrypted || this.req.headers['x-forwarded-proto'] === 'https';
  }

  // Check if a specific query parameter exists
  hasQueryParam(key) {
    return this.query.hasOwnProperty(key);
  }

  // Check if a specific header exists
  hasHeader(key) {
    return this.req.headers.hasOwnProperty(key.toLowerCase());
  }
}

export default Request 

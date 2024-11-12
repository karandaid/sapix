import url from 'url'
import parserBody from './utils/parser.mjs'
import formidable, { errors as formidableErrors } from 'formidable';

class Request {
  constructor(req) {
    this.req = req;
    const { query, pathname } = url.parse(req.url, true);
    this.query = query;
    this.pathname = pathname;
    this.session = ''
  }

  // Get the full request URL
  getFullUrl() {
    return `${this.req.headers.host}${this.req.url}`;
  }

  // Get the full request URL
  getUrl() {
    return `${this.req.url}`;
  }

  // Get a specific query parameter or all query parameters
  getQuery(key = null) {
    return key ? this.query[key] : this.query;
  }

  // Get a specific header or all headers
  getHeader(key = null) {
    return key ? this.req.headers[key.toLowerCase()] : this.req.headers;
  }

  // Get the HTTP method (GET, POST, etc.)
  getMethod() {
    return this.req.method;
  }

  async _getBody() {
    return new Promise((resolve, reject) => {
      const contentType = this.req.headers['content-type'] || '';
      const baseContentType = contentType.split(";")[0].trim().toLowerCase();

      // Handle multipart/form-data using formidable
      if (baseContentType === 'multipart/form-data') {
        const form = formidable({
          multiples: true, // Allow multiple file uploads
          maxFileSize: 50 * 1024 * 1024, // 50MB
          keepExtensions: true,
          maxFieldsSize: 10 * 1024 * 1024, // 10MB
          allowEmptyFiles: true,
          // Optionally, you can specify upload directory and other options
          // uploadDir: path.join(__dirname, 'uploads'),
          // encoding: 'utf-8',    
        });
        form.parse(this.req, (err, fields, files) => {
          if (err) {
            // Check for specific errors
            if (err.code === formidableErrors.maxFieldsExceeded) {
              console.error('Max fields exceeded:', err);
              return reject({ error: true, message: 'Max fields exceeded', details: err.message });
            }
            console.error('Formidable parsing error:', err);
            return reject({ error: true, message: 'Error parsing form data', details: err.message });
          }
          resolve({ fields, files });
        });
      } else {
        // Handle other types of body parsing
        let body = '';
        this.req.on('data', (chunk) => {
          body += chunk;
        });

        this.req.on('end', async () => {
          try {
            let parsedBody = {};
            if (body) {
              parsedBody = await parserBody(body, contentType, this.req);
            }
            resolve(parsedBody);
          } catch (err) {
            console.error('Body parsing error:', err);
            reject({ error: true, message: 'Invalid JSON', details: err.message });
          }
        });

        this.req.on('error', (err) => {
          console.error('Request error:', err);
          reject({ error: true, message: 'Error receiving request data', details: err.message });
        });
      }
    });
  }

  // Check if the request is secure (HTTPS)
  isSecure() {
    return this.req.connection.encrypted || this.req.headers['x-forwarded-proto'] === 'https';
  }

  // Get client IP address
  getClientIP() {
    const forwarded = this.req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0] : this.req.connection.remoteAddress;
  }

  // Check if a specific header exists
  hasHeader(key) {
    return this.req.headers.hasOwnProperty(key.toLowerCase());
  }

  // Check the content type
  getContentType() {
    return this.req.headers['content-type'] || '';
  }

  // Check if the request content type matches a specific type
  isContentType(type) {
    return this.getContentType().includes(type);
  }
}

export default Request 

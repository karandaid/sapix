import Cookie from './cookies/cookie.mjs'
import CookieParser from './cookies/cookie_parser.mjs'
import fs from 'fs';

import path from 'path';
import mime from 'mime-types';
import http from 'http';


class Response {
    constructor(res, req) {
        this.res = res;
        this.req = req
        this.query = {}
        this.path_params = {}
        this.body = ''
        this._headersMap = new Map();
    }

    /**
     * @param {any} cookie
     */
    set cookies(cookie) {
        if (typeof cookie == 'string') {
            let cookies = CookieParser.parse(cookie);
            let _list = []
            for (let _cookie of cookies.values()) {
                _list.push(_cookie.toString())
            }
            // this.setHeader('Set-Cookie', _list)
            this._cookieList = _list
        } else if (cookie instanceof Cookie) {
            // this.setHeader('Set-Cookie', cookie.toString())
            this._cookieList = [ cookie.toString() ]
        } else if (Array.isArray(cookie) && cookie.every(c => c instanceof Cookie)) {
            let _list = []
            for (let _cookie of cookie) {
                if (_cookie instanceof Cookie) {
                    _list.push(_cookie.toString())
                }
            }
            // this.setHeader('Set-Cookie', _list)
            this._cookieList = _list
        } else {
            this._cookieList = []
            console.warn('Invalid cookie object provided.');
        }
        return this;
    }

    get cookies() {
        const cookieHeader = this.req.headers.cookie || '';
        if (!cookieHeader) {
            return res.sendError('No cookies found in the request.', 400);
        }

        const cookieStrings = cookieHeader.split(';').map(part => part.trim()).filter(Boolean);
        const cookies = cookieStrings.map(cookieStr => Cookie.parse(cookieStr));

        const deserializedCookies = cookies.reduce((acc, cookie) => {
            acc[cookie.name] = Cookie.deserializeValue(cookie.value);
            return acc;
        }, {});
        return deserializedCookies
    }

    get headers() {
        return this.req.headers
    }

    getCookieByName(name) {
        const cookies = this.cookies; // Get all cookies as an object
        return cookies[name] || null; // Return the cookie value if found, otherwise null
    }
    

    setCookies(cookie) {
        this.cookies = cookie
    }

    // Set the status code
    status(code) {
        if (code < 100 || code > 599) {
            throw new Error('Invalid status code');
        }

        this.res.statusCode = code;
        return this; // Allow method chaining
    }

    /**
     * Sends the HTTP status code with the standard status message.
     * @param {number} code - The HTTP status code.
     */
    sendStatus(code) {
        const statusMessage =  http.STATUS_CODES[code] || 'Unknown Status';
        this.status(code).sendText(statusMessage);
    }


    // Set a header
    setHeader(key, value) {
        if (typeof key === 'object') {
            for (let [headerKey, headerValue] of Object.entries(key)) {
                this._headersMap.set(headerKey, headerValue);
            }
        } else {
            this._headersMap.set(key, value);
        }
        return this;
    }

    _applyHeaders() {
        // Apply headers from the Map when sending the response
        for (let [key, value] of this._headersMap) {
            this.res.setHeader(key, value);
        }
        if (this._cookieList) {
            this.res.setHeader('Set-Cookie', this._cookieList);
        }
    }

    // Send a plain text response
    sendText(text) {
        this.setHeader('Content-Type', 'text/plain; charset=utf-8');
        this._applyHeaders();
        this.res.end(text);
    }

    // Send an HTML response
    sendHTML(html) {
        this.setHeader('Content-Type', 'text/html; charset=utf-8');
        this._applyHeaders();
        this.res.end(html);
    }

    // Send a JSON response
    sendJSON(jsonObject) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this._applyHeaders();
        this.res.end(JSON.stringify(jsonObject));
    }

    // Send an error response with status code
    sendError(message, code = 500) {
        this.status(code).sendJSON({ error: message });
    }

    /**
     * Sends a Buffer as a response.
     * @param {Buffer} buffer - The buffer containing the data to send.
     * @param {string} [contentType='application/octet-stream'] - The MIME type of the data.
     */
    sendBuffer(buffer, contentType = 'application/octet-stream') {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Data must be a Buffer.');
        }

        this.setHeader('Content-Type', contentType);
        this.setHeader('Content-Length', buffer.length);
        this._applyHeaders();
        this.res.end(buffer);
    }

    /**
     * Sends a file as a response.
     * @param {string} filePath - The relative or absolute path to the file.
     */
    sendFile(filePath) {
        try {
            // Resolve the absolute path to prevent path traversal attacks
            const absolutePath = path.resolve(filePath);
            // Determine the MIME type based on the file extension
            const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';

            // Create a read stream and pipe it to the response
            const fileData = fs.readFileSync(absolutePath);
            this.setHeader('Content-Type', mimeType);
            this.setHeader('Content-Length', fileData.length);
            this.setHeader('Content-Disposition', `attachment; filename=${path.basename(absolutePath)}`);
            this._applyHeaders();
            this.res.end(fileData)
        } catch (error) {
            console.error('sendFile Error:', error);
            if (error.code === 'ENOENT') {
                this.sendError('File not found.', 404);
                this.res.end();
            } else {
                this.sendError('Internal Server Error.', 500);
                this.res.end();
            }
        }
    }

    // Redirect to a different URL
    redirect(url, statusCode = 302) {
        this.status(statusCode).setHeader('Location', url).end();
    }

    // Set CORS headers for cross-origin requests
    setCORS(origin = '*', methods = 'GET,POST,PUT,DELETE', headers = 'Content-Type') {
        this.setHeader({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': methods,
            'Access-Control-Allow-Headers': headers,
        });
        return this;
    }

    // Stream data response
    stream(data) {
        this.setHeader('Content-Type', 'application/octet-stream');
        data.pipe(this.res);
    }

    // End the response manually
    end(data = '') {
        this.res.end(data);
    }
}

export default Response 
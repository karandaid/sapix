// lib/MyServer.js

import http from 'http';
import https from 'https';
import fs from 'fs';
import url from 'url';

/**
 * A versatile server library supporting HTTP and HTTPS with middleware and routing.
 */
class NovaXServer {
  constructor() {
    this.port = 3000;
    this.contentType = 'text/plain'
    this.useHttps = false;
    this.sslOptions = {};
    this.routes = null;
  }

  setContentType(type) {
    this.contentType = type
    return this
  }

  /**
   * Sets the port for the server.
   * @param {number} port - The port number.
   * @returns {MyServer} The server instance for chaining.
   */
  setPort(port) {
    this.port = port;
    return this;
  }

  setRoute(routes) {
    this.routes = routes;
    return this;
  }

  start() {
    const server = http.createServer((req, res) => {
      if (this.routes) {
        this.routes.handle(req, res, this.contentType)
      } else {
        res.statusCode = 500
        res.end('No routes defined')
      }
    });

    server.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`)
    })

    return this
  }
}

export default NovaXServer;

// lib/server.js

import http from 'http';
import https from 'https';

/**
 * A versatile server library supporting HTTP and HTTPS with middleware and routing.
 */
class SapixServer {
  constructor() {
    this.serverPort = 3000;
    this.defaultContentType = 'text/plain';
    this.isHttpsEnabled = false;
    this.sslConfig = {};
    this.serverRoutes = {};
    this.serverInstance = null;
  }

  setContentType(type) {
    this.defaultContentType = type;
    return this;
  }

  setPort(port) {
    this.serverPort = port;
    return this;
  }

  setRoutes(routes) {
    this.serverRoutes = routes;
    return this;
  }

  /**
   * Enables HTTPS with the given SSL options.
   * @param {Object} sslOptions - An object containing the `key` and `cert` for HTTPS.
   * @returns {SapixServer} The current server instance for method chaining.
   */
  enableHttps(sslOptions) {
    this.isHttpsEnabled = true;
    this.sslConfig = sslOptions;
    return this;
  }

  setErrorHandler(errorHandler) {
    return this;
  }

  serveStatic(directory) {
    return this;
  }

  shutdown() {
    return this;
  }

  setHeaders(headers) {
    return this;
  }

  /**
   * Starts the server, either with HTTP or HTTPS, based on the configuration.
   * The server listens on the configured port and handles incoming requests using the defined routes.
   * If no routes are defined, it responds with a 500 error indicating missing routes.
   * @returns {SapixServer} The current server instance for method chaining.
   */
  start() {
    const requestHandler = (req, res) => {
      if (this.serverRoutes) {
        this.serverRoutes.routeHandle(req, res);
      } else {
        res.statusCode = 500;
        res.end('No routes defined');
      }
    };

    if (this.isHttpsEnabled && this.sslConfig.key && this.sslConfig.cert) {
      // Create an HTTPS server
      this.serverInstance = https.createServer(this.sslConfig, requestHandler);
    } else {
      // Default to HTTP server
      this.serverInstance = http.createServer(requestHandler);
    }

    this.serverInstance.listen(this.serverPort);
    return this.serverInstance;
  }

  stop(callback) {
    if (this.serverInstance) {
      this.serverInstance.close(callback);
    }
  }
}

export default SapixServer;

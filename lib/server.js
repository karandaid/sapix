// lib/server.js

import http from 'http';

/**
 * A versatile server library supporting HTTP and HTTPS with middleware and routing.
 */
class SapixServer {
  constructor() {
    /**
     * @property {number} serverPort - The port on which the server will listen for requests. Default is 3000.
     * @property {string} defaultContentType - The default content type for the server responses. Default is 'text/plain'.
     * @property {boolean} isHttpsEnabled - A flag to indicate if HTTPS is enabled. Default is false.
     * @property {Object} sslConfig - The SSL configuration for HTTPS (if enabled). Default is an empty object.
     * @property {Object} serverRoutes - The routing configuration for handling HTTP requests. Default is an empty object.
     */
    this.serverPort = 3000;
    this.defaultContentType = 'text/plain';
    this.isHttpsEnabled = false;
    this.sslConfig = {};
    this.serverRoutes = {};
  }

  /**
   * Sets the default content type for server responses.
   * @param {string} type - The content type to set (e.g., 'text/html', 'application/json').
   * @returns {SapixServer} The current server instance for method chaining.
   */
  setContentType(type) {
    this.defaultContentType = type;
    return this;
  }

  /**
   * Sets the port number for the server to listen on.
   * @param {number} port - The port number to set (e.g., 8080).
   * @returns {SapixServer} The current server instance for method chaining.
   */
  setPort(port) {
    this.serverPort = port;
    return this;
  }

  /**
   * Configures the routes that the server will handle.
   * @param {Object} routes - An object that contains the routing logic for handling different HTTP requests.
   * @returns {SapixServer} The current server instance for method chaining.
   */
  setRoutes(routes) {
    this.serverRoutes = routes;
    return this;
  }

  /**
   * Placeholder for enabling HTTPS.
   * To be implemented later.
   */
  enableHttps(sslOptions) {
    // Empty function to be implemented later
    return this;
  }

  /**
   * Placeholder for adding middleware support.
   * To be implemented later.
   */
  use(middleware) {
    // Empty function to be implemented later
    return this;
  }

  /**
   * Placeholder for setting custom error handler.
   * To be implemented later.
   */
  setErrorHandler(errorHandler) {
    // Empty function to be implemented later
    return this;
  }

  /**
   * Placeholder for serving static files.
   * To be implemented later.
   */
  serveStatic(directory) {
    // Empty function to be implemented later 
    return this;
  }

  /**
   * Placeholder for graceful shutdown of the server.
   * To be implemented later.
   */
  shutdown() {
    // Empty function to be implemented later
    return this;
  }

  /**
   * Placeholder for setting custom headers.
   * To be implemented later.
   */
  setHeaders(headers) {
    // Empty function to be implemented later
    return this;
  }

  /**
   * Starts the server, either with HTTP or HTTPS, based on the configuration.
   * The server listens on the configured port and handles incoming requests using the defined routes.
   * If no routes are defined, it responds with a 500 error indicating missing routes.
   * @returns {SapixServer} The current server instance for method chaining.
   */
  start() {
    const server = http.createServer((req, res) => {
      if (this.serverRoutes) {
        this.serverRoutes.routeHandle(req, res); // Calls the route handler if routes are defined
      } else {
        res.statusCode = 500; // Sets the status code to 500 if no routes are defined
        res.end('No routes defined'); // Sends an error message in the response
      }  
    });

    // Starts the server and listens on the configured port
    let serverResponse = server.listen(this.serverPort);

    return serverResponse;
  }
}

export default SapixServer;

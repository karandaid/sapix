// sapixRoutes.js

import Response from './response.js'
import Request from './request.js'
import urllib from 'url';

class sapixRoutes {
    constructor() {
        // Initialize a map to store routes
        // The structure is: { 'GET': { '/path': handlerFunction, ... }, ... }
        this.routes = {};
    }

    /**
     * Adds a route to the routing table.
     * @param {string} method - The HTTP method (GET, POST, etc.).
     * @param {string} path - The route path (e.g., '/users').
     * @param {function} handler - The function to handle the route.
     */
    addRoute(method, path, handler) {
        method = method.toUpperCase();
        if (!this.routes[method]) {
            this.routes[method] = {};
        }
        this.routes[method][path] = handler;
    }

    /**
     * Adds a GET route.
     * @param {string} path - The route path.
     * @param {function} handler - The handler function.
     */
    get(path, handler) {
        this.addRoute('GET', path, handler);
    }

    /**
     * Adds a POST route.
     * @param {string} path - The route path.
     * @param {function} handler - The handler function.
     */
    post(path, handler) {
        this.addRoute('POST', path, handler);
    }

    /**
     * Adds a PUT route.
     * @param {string} path - The route path.
     * @param {function} handler - The handler function.
     */
    put(path, handler) {
        this.addRoute('PUT', path, handler);
    }

    /**
     * Adds a DELETE route.
     * @param {string} path - The route path.
     * @param {function} handler - The handler function.
     */
    delete(path, handler) {
        this.addRoute('DELETE', path, handler);
    }

    /**
     * Adds a PATCH route.
     * @param {string} path - The route path.
     * @param {function} handler - The handler function.
     */
    patch(path, handler) {
        this.addRoute('PATCH', path, handler);
    }

    matchRoute(method, url) {
        const routesForMethod = this.routes[method] || {};
        // Separate the path and query string
        const [path, _] = url.split('?'); 
        const urlParts = path.split('/').filter(Boolean); // Split URL into parts

        for (const route in routesForMethod) {
            const routeParts = route.split('/').filter(Boolean);

            if (routeParts.length !== urlParts.length) continue; // Skip if lengths don't match

            const params = {};
            let match = true;

            // Compare each part of the route with the URL
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    // If it's a parameter (e.g., :id), capture it
                    const paramName = routeParts[i].slice(1);
                    params[paramName] = urlParts[i];
                } else if (routeParts[i] !== urlParts[i]) {
                    match = false; // If a static part doesn't match, skip this route
                    break;
                }
            }

            if (match) return { handler: routesForMethod[route], params };
        }
        return null;
    }

    async handle(req, res, type, { hostname = 'localhost', port = '3333' } ){
        // const { parser, on, addListener, setEncoding, complete, headers, aborted, upgrade, url, method, statusCode, statusMessage }  = req
        // const { outputData, outputSize, writable, destroyed, chunkedEncoding, finished } = res
        const { url, method, headers } = req

        const parsedUrl = urllib.parse(req.url, true);

        // Extract the path and query parameters
        const path = parsedUrl.pathname;
        const query = parsedUrl.query;

        // for (const key in req) {
        //     console.log(key)
        // }

        const response = new Response(res);
        const request = new Request(req)

        // Access query parameters
        console.log('okay')
        let body = await request.getBody(res)
        console.log(body)

        if (this.routes[method]) {
            const routeMatch = this.matchRoute(method, url);
            if (routeMatch) {
                routeMatch.handler(response, query, routeMatch.params, body);
            } else {
                // If the URL route does not exist, respond with 404
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`Route not found: ${url}`);
            }
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404
            res.write('Not found')
        }
        res.end()
        // console.log(res)
    }
}

export default sapixRoutes;

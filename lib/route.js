// SapixRoutes.js

import Response from './response.js'
import Request from './request.js'
import urllib from 'url';
import FileFunctionFetcher from './utils/handler_fetcher.mjs'
import matchURLToPatterns from './utils/patternMatcher.mjs'
import cache, { hasher } from './globals.mjs'

class SapixRoutes {
    constructor() {
        // Initialize a map to store routes
        // The structure is: { 'GET': { '/path': handlerFunction, ... }, ... }
        this.routes = {};
        this.prefix_route = ''
    }

    prefix(prefix){
        this.prefix_route = prefix.replace(/\/+$/, '')
        return this
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
        let proper_route_key = this.prefix_route + path.replace(/\/+$/, '')
        if(proper_route_key.length <= 0) {
            proper_route_key = '/'
        }
        this.routes[method][proper_route_key] = handler;
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

    /**
     * Adds middleware to be executed before the routes.
     * Middleware functions will receive `req`, `res`, and `next`.
     * @param {function} middleware - Middleware function to execute.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    addMiddleware(middleware) {
        // Coming soon: logic to handle middleware
        return this;
    }

    /**
     * Adds a group of routes under a common prefix.
     * @param {string} prefix - The common prefix for all routes in this group.
     * @param {function} routeGroup - A function where the routes are defined.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    addRouteGroup(prefix, routeGroup) {
        // Coming soon: logic for grouping routes
        return this;
    }

    /**
     * Sets a fallback route to handle unmatched requests (like a 404 page).
     * @param {function} handler - The function to handle unmatched routes.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    setFallbackRoute(handler) {
        // Coming soon: fallback route logic
        return this;
    }

    /**
     * Removes a route from the routing table.
     * @param {string} method - The HTTP method (GET, POST, etc.).
     * @param {string} path - The route path to be removed.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    removeRoute(method, path) {
        // Coming soon: logic to remove routes
        return this;
    }

    /**
     * Adds an alias for an existing route.
     * @param {string} method - The HTTP method.
     * @param {string} originalPath - The original route path.
     * @param {string} aliasPath - The alias path.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    addRouteAlias(method, originalPath, aliasPath) {
        // Coming soon: logic for adding route aliases
        return this;
    }

    /**
     * Adds a redirect from one route to another.
     * @param {string} fromPath - The original path to redirect from.
     * @param {string} toPath - The path to redirect to.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    addRedirect(fromPath, toPath) {
        // Coming soon: logic for adding route redirection
        return this;
    }

    /**
     * Lists all the registered routes in the route map.
     * @returns {Object} An object containing all the routes.
     * Coming soon.
     */
    listRoutes() {
        // Coming soon: logic to list all routes
        return {};
    }

    /**
     * Adds rate-limiting to a specific route.
     * @param {string} path - The route path.
     * @param {number} limit - The maximum number of requests allowed within the time window.
     * @param {number} windowMs - The time window in milliseconds for the rate limit.
     * @returns {CustomRoutes} The current instance for method chaining.
     * Coming soon.
     */
    addRateLimit(path, limit, windowMs) {
        // Coming soon: logic for adding rate limiting to routes
        return this;
    }

    async routeHandle(req, res){
        // const { parser, on, addListener, setEncoding, complete, headers, aborted, upgrade, url, method, statusCode, statusMessage }  = req
        // const { outputData, outputSize, writable, destroyed, chunkedEncoding, finished } = res
        const { url, method } = req

        const parsedUrl = urllib.parse(req.url, true);

        // Extract the path and query parameters
        // const path = parsedUrl.pathname;
        const query = parsedUrl.query;

        const response = new Response(res, req);
        const request = new Request(req)


        if (this.routes[method]) {
            let body = await request.getBody(res)

            const [path, _] = url.split('?');

            let routePath = cache.get(url)
            let doesItEverMentioned = true;

            if(!routePath) {
                routePath = matchURLToPatterns([path], Object.keys(this.routes[method])).get(path)
                let required_key = routePath.required_key
                if(required_key == '/') {
                    required_key = ''
                }
                doesItEverMentioned = this.routes[method].hasOwnProperty(`/${required_key}`)

                if(doesItEverMentioned){
                    cache.set(url, routePath)
                }
            }
            
            if(!doesItEverMentioned) {
                res.statusCode = 501
                res.end('You never implemented it')
                return;
            }

            const key = hasher.hash(`handler_${routePath.pattern}_${method}`)

            let routeFunctionHandler = cache.get(key)
            let routePathParameters = routePath.params

            if(!routeFunctionHandler){
                // Check if the handler exists in the routes object
                let required_key = routePath.required_key
                if(required_key == '/') {
                    required_key = ''
                }
                routeFunctionHandler = this.routes[method][`/${required_key}`]

                // If not found in routes, try to fetch it
                if(!routeFunctionHandler) {
                    try {
                        // Create an instance of the FileFunctionFetcher class
                        const handler = new FileFunctionFetcher("sapix_api", `${routePath.pattern}/${method.toLowerCase()}`);
    
                        // Fetch the function and call it
                        routeFunctionHandler = await handler.fetchFunction();
                    } catch (err) {
                        console.error('Error fetching the function:', err);
                    }
                }

                // Cache the handler if it's found
                if (routeFunctionHandler) {
                    cache.set(key, routeFunctionHandler);
                }
            }


            if(!routeFunctionHandler) {
                res.statusCode = 204
            }else{
                routeFunctionHandler(response, query, routePathParameters, body);
            }
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404
            res.write('Not found')
        }
        res.end()
    }
}

export default SapixRoutes;

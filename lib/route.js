// SapixRoutes.js

import Response from './response.js'
import Request from './request.js'
import urllib from 'url';
import FileFunctionFetcher from './utils/handler_fetcher.mjs'
import matchURLToPatterns from './utils/patternMatcher.mjs'
import cache, { hasher } from './globals.mjs'
import babelParser from '@babel/parser'

class SapixRoutes {
    constructor() {
        // Initialize a map to store routes
        // The structure is: { 'GET': { '/path': handlerFunction, ... }, ... }
        this.routes = {};
        this.prefix_route = ''
        this.middlewares = [];
    }

    prefix(prefix) {
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
        if (proper_route_key.length <= 0) {
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
     * Adds a middleware function to the middleware array.
     * Middleware functions will be called in the order they are added.
     * @param {function} middleware - The middleware function.
     * The middleware receives `req`, `res`, and `next`.
     */
    tap(...middleware) {
        const middlewareHandler = middleware[middleware.length - 1];
        const middlewareRoute = middleware[0];

        // Function to extract `@method` information from comments
        function extractMethod(commentValue) {
            const methodPattern = /@method\s+([\w\s,]+)/i; // Regex to capture methods (GET, POST, etc.)
            const match = methodPattern.exec(commentValue);
            if (match && match[1]) {
                return match[1].split(',').map(method => method.trim().toUpperCase());
            }
            return ['all'];
        }

        // Function to extract `@method` information from comments
        function extractSecure(commentValue) {
            const methodPattern = /@secure\s+([\w\s,]+)/i; // Regex to capture secure annotation (HTTPS)
            const match = methodPattern.exec(commentValue);
            if (match && match[1]) {
                return match[1].split(',').map(method => method.trim());
            }
            return ['none'];
        }

        function fetchProcessCommentsOfHandler(handler) {
            const ast = babelParser.parse(handler.toString(), {
                sourceType: 'module',
                plugins: [
                    // Add any plugins you need, e.g., jsx, typescript, etc.
                ],
                comments: true, // Enable comment extraction
            });

            // Access comments from the AST
            const comments = ast.comments[0];
            let allowedMethods = 'all'
            let securityOptions = 'none'

            if (comments) {
                // Process the comments to extract `@method`
                const processedComments = {
                    type: comments.type,
                    value: comments.value.trim(),
                    methods: extractMethod(comments.value),
                    secure: extractSecure(comments.value)
                };

                allowedMethods = processedComments.methods
                securityOptions = processedComments.secure
            }

            return {
                'allowedMethods': allowedMethods,
                'securityOptions': securityOptions
            }
        }

        switch (typeof middlewareRoute) {
            case 'string': this.middlewares.push({ [middlewareRoute]: middlewareHandler, ...fetchProcessCommentsOfHandler(middlewareHandler) }); break;
            default:
                this.middlewares.push({ '/': middlewareHandler, ...fetchProcessCommentsOfHandler(middlewareHandler) });
                break;
        }

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
     * Internal method to execute middlewares sequentially.
     * @param {Array} middlewares - Array of middleware functions.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {function} finalHandler - The final handler to be called after all middleware.
     */
    executeMiddlewares(response, request, query, routePathParameters, body, finalHandler) {
        // Define the main function to execute middleware functions in sequence
        const execute = (index) => {
            // Check if there are more middlewares to process
            if (index < this.middlewares.length) {
                // Destructure middleware configuration: route, function, allowed methods, and security settings
                const [[middlewareRoute, middleware], methods, secure] = Object.entries(this.middlewares[index]);
    
                // Check if middleware route is fixed (not a dynamic route)
                const isFixedRoute = /^\/[a-zA-Z0-9\-_\/]*$/.test(middlewareRoute);
                if (!isFixedRoute) {
                    console.warn(`Warning: Might not work, middleware with non-fixed route: ${middlewareRoute}`);
                }
    
                // Retrieve request URL and HTTP method for comparison
                const url = request.getUrl();
                const method = request.getMethod();
                const allowedMethods = methods[1]; // Extract the methods allowed for this middleware
    
                // Check if the request URL matches the middleware route and if the method is allowed
                const isUrlMatching = url.startsWith(middlewareRoute);
                const isMethodAllowed = allowedMethods.includes(method) || allowedMethods.includes('all');

   
                // If URL or method doesn't match, skip to the next middleware
                if (!isUrlMatching || !isMethodAllowed) {
                    execute(index + 1);
                    return;
                }
    
                // Ensure secure middleware is only executed on HTTPS requests, if specified
                if (secure[1].includes('HTTPS') && !request.isSecure()) {
                    execute(index + 1);
                    return;
                }
    
                // Additional security check: skip middleware if url doesn't match
                if (!request.getUrl().startsWith(middlewareRoute)) {
                    execute(index + 1);
                    return;
                }
      
                // Call middleware with appropriate parameters based on its parameter count                
                middleware(response, request, query, routePathParameters, body, () => execute(index + 1));
            } else {
                // All middlewares processed, call the final handler
                finalHandler();
            }
        };
    
        // Start executing middlewares from the first in the list
        execute(0);
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

    async routeHandle(req, res) {
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
            let body = await request._getBody()

            const [path, _] = url.split('?');

            let routePath = cache.get(url)
            let doesItEverMentioned = true;

            if (!routePath) {
                routePath = matchURLToPatterns([path], Object.keys(this.routes[method])).get(path)
                let required_key = routePath.required_key
                if (required_key == '/') {
                    required_key = ''
                }
                doesItEverMentioned = this.routes[method].hasOwnProperty(`/${required_key}`)

                if (doesItEverMentioned) {
                    cache.set(url, routePath)
                }
            }

            if (!doesItEverMentioned) {
                res.statusCode = 501
                res.end('You never implemented it')
                return;
            }

            const key = hasher.hash(`handler_${routePath.pattern}_${method}`)

            let routeFunctionHandler = cache.get(key)
            let routePathParameters = routePath.params

            if (!routeFunctionHandler) {
                // Check if the handler exists in the routes object
                let required_key = routePath.required_key
                if (required_key == '/') {
                    required_key = ''
                }
                routeFunctionHandler = this.routes[method][`/${required_key}`]

                // If not found in routes, try to fetch it
                if (!routeFunctionHandler) {
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

            if (!routeFunctionHandler) {
                res.statusCode = 204
            } else {
                response.query = query
                response.path_params = routePathParameters
                response.body = body
                const final_handler = () => routeFunctionHandler(response, request, query, routePathParameters, body);

                this.executeMiddlewares(response,
                    request,
                    query,
                    routePathParameters,
                    body, final_handler)
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

class Response {
    constructor(res) {
        this.res = res;
    }

    // Set the status code
    status(code) {
        this.res.statusCode = code;
        return this; // Allow method chaining
    }

    // Set a header
    setHeader(key, value) {
        this.res.setHeader(key, value);
        return this;
    }

    // Send a plain text response
    sendText(text) {
        this.setHeader('Content-Type', 'text/plain');
        this.res.end(text);
    }

    // Send an HTML response
    sendHTML(html) {
        this.setHeader('Content-Type', 'text/html');
        this.res.end(html);
    }

    // Send a JSON response
    sendJSON(jsonObject) {
        this.setHeader('Content-Type', 'application/json');
        this.res.end(JSON.stringify(jsonObject));
    }

    // Send an error response with status code
    sendError(message, code = 500) {
        this.status(code).sendJSON({ error: message });
    }

    // Redirect to a different URL
    redirect(url) {
        this.status(302).setHeader('Location', url).end();
    }

    // End the response manually
    end(data = '') {
        this.res.end(data);
    }
}

export default Response 
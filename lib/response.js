import Cookie from './cookies/cookie.mjs'
import CookieParser from './cookies/cookie_parser.mjs'
class Response {
    constructor(res, req) {
        this.res = res;
        this.req = req
    }

    /**
     * @param {any} cookie
     */
    set cookies(cookie) {
        if(typeof cookie == 'string') {
            let cookies = CookieParser.parse(cookie);
            let _list = []
            for(let _cookie of cookies.values()) {
                _list.push(_cookie.toString()) 
            }
            this.setHeader('Set-Cookie', _list)
        }else if(cookie instanceof Cookie) {
            this.setHeader('Set-Cookie', cookie.toString())
        }else if(cookie instanceof Array) {
            let _list = []
            for(let _cookie of cookie) {
                if(_cookie instanceof Cookie) {
                    _list.push(_cookie.toString()) 
                }
            }
            this.setHeader('Set-Cookie', _list)
        }else{
        }
        return this
    }

    redirectTo(code, redirect) {
        this.res.redirectTo(code, redirect)
    }

    get cookies() {
        const cookieHeader = this.req.headers.cookie || '';
        if (!cookieHeader) {
            return res.status(400).sendText('No cookies found in the request.');
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

    setCookies(cookie) {
        this.cookies = cookie
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
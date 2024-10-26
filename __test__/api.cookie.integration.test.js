import request from 'supertest';
import SapixServer from '../lib/server.js';
import SapixRoutes from '../lib/route.js';
import Cookie from '../lib/cookies/cookie.mjs';

// Initialize routes
const routes = new SapixRoutes();


/**
 * 1. Root Route - Simple Cookie with String Value (Valid)
 */
routes.get('/', (res) => {
  let cookie = new Cookie('session_id', 'abc123', {
    maxAge: 3600,
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });
  res.cookies = cookie;
  res.status(200).sendText('Welcome to SapixRoutes Home Page!');
});

/**
 * 2. Complex Cookies Route (`/complex`)
 */
routes.get('/complex', (res) => {
  const preferencesCookie = new Cookie('preferences', {
    theme: 'dark',
    language: 'en',
    notifications: { email: true, sms: false }
  }, { maxAge: 3600 });

  const activitiesCookie = new Cookie('activities', ['login', 'viewed_profile', 'logout'], { maxAge: 3600 });

  const sessionData = new Map([['token', 'xyz789'], ['expires', '2024-12-31T23:59:59Z']]);
  const sessionCookie = new Cookie('sessionData', Object.fromEntries(sessionData), { maxAge: 3600 });

  res.cookies = [preferencesCookie, activitiesCookie, sessionCookie];
  res.status(200).sendText('Complex cookies have been set successfully!');
});

/**
 * 3. JWT Token Route (`/jwt`)
 */
routes.get('/jwt', (res) => {
  const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'; // Replace with actual JWT
  const jwtCookie = new Cookie('jwt', jwtToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
    maxAge: 3600,
  });
  res.cookies = jwtCookie;
  res.status(200).sendText('JWT token has been set in a secure cookie!');
});

/**
 * 4. Multiple Cookies via Single String Route (`/withString`)
 */
routes.get('/withString', (res) => {
  const cookieString = 'sessionId=abc123; Max-Age=2600; theme=dark; SameSite=Strict; loginToken=xyz789; Path=/; HttpOnly; Secure; Max-Age=600';
  res.cookies = cookieString;
  res.status(200).sendText('Multiple cookies have been set using a single cookie string!');
});

/**
 * 5. Single Cookie via String Route (`/withSingleCookieString`)
 */
routes.get('/withSingleCookieString', (res) => {
  const cookieString = 'sessionId=abc123; Path=/; HttpOnly; Secure; Max-Age=600';
  res.cookies = cookieString;
  res.status(200).sendText('A single cookie has been set using a cookie string!');
});

/**
 * 6. Invalid Cookie String Route (`/withInvalidString`)
 */
routes.get('/withInvalidString', (res) => {
  const cookieString = 'aa'; // Invalid format
  res.cookies = cookieString;
  res.status(200).sendText('Attempted to set an invalid cookie string!');
});

/**
 * 7. Missing Cookie Name Route (`/invalid/missing-name`)
 */
routes.get('/invalid/missing-name', (res) => {
  try {
    const cookie = new Cookie('', 'value123', { maxAge: 3600 });
  } catch (e) {
    res.sendError(e, 400);
  }
});

/**
 * 8. Missing Cookie Value Route (`/invalid/missing-value`)
 */
routes.get('/invalid/missing-value', (res) => {
  try {
    const cookie = new Cookie('missingValue', null, { maxAge: 3600 });
  } catch (e) {
    res.sendError(e, 400);
  }
});

/**
 * 9. Invalid Max-Age Route (`/invalid/max-age`)
 */
routes.get('/invalid/max-age', (res) => {
  try {
    const cookie = new Cookie('negativeMaxAge', 'test', { maxAge: -100 });
    res.cookies = cookie;
    res.status(200).sendText('This should not be displayed.');
  } catch (e) {
    res.sendError(e.message, 400);
  }
});

/**
 * 10. Invalid SameSite Value Route (`/invalid/samesite`)
 */
routes.get('/invalid/samesite', (res) => {
  try {
    const cookie = new Cookie('invalidSameSite', 'test', { sameSite: 'Unknown' });
  res.cookies = cookie;
  res.status(200).sendText('This should not be displayed.');
} catch (e) {
  res.sendError(e.message, 400);
}
});

/**
 * 11. Exceeding Cookie Size Limit Route (`/invalid/size`)
 */
routes.get('/invalid/size', (res) => {
  try {
    const largeValue = 'a'.repeat(5000); // 5KB
    const cookie = new Cookie('largeCookie', largeValue, { maxAge: 3600 });
} catch (e) {
  res.sendError(e.message, 400);
}
});

/**
 * 12. Mixed Valid and Invalid Cookies Route (`/mixed`)
 */
routes.get('/mixed', (res) => {
  try {
    const validCookie = new Cookie('validCookie', 'validValue', { maxAge: 3600 });
  const invalidCookie1 = new Cookie('', 'noName', { maxAge: 3600 });
  const invalidCookie2 = new Cookie('invalidSameSite', 'test', { sameSite: 'Unknown' });

  res.cookies = [validCookie, invalidCookie1, invalidCookie2];
  res.status(200).sendText('Mixed cookies have been set!');
} catch (e) {
  res.sendError(e.message, 400);
}
});

/**
 * 13. Retrieve and Deserialize Complex Cookies Route (`/retrieve`)
 */
routes.get('/retrieve', (res) => {
  const cookieHeader = res.headers.cookie || '';
  if (!cookieHeader) return res.status(400).sendText('No cookies found in the request.');

  const cookieStrings = cookieHeader.split(';').map(part => part.trim()).filter(Boolean);
  const cookies = cookieStrings.map(cookieStr => Cookie.parse(cookieStr));

  const preferencesCookie = cookies.find(cookie => cookie.name === 'preferences');
  const activitiesCookie = cookies.find(cookie => cookie.name === 'activities');
  const sessionCookie = cookies.find(cookie => cookie.name === 'sessionData');

  const preferences = preferencesCookie ? Cookie.deserializeValue(preferencesCookie.value) : null;
  const activities = activitiesCookie ? Cookie.deserializeValue(activitiesCookie.value) : null;
  const sessionData = sessionCookie ? Cookie.deserializeValue(sessionCookie.value) : null;

  res.status(200).sendJSON({ preferences, activities, sessionData });
});

// Additional route definitions would follow a similar pattern for remaining routes.


// Initialize server with the defined routes
const server = new SapixServer().setPort(3334).setRoutes(routes);

// Helper function to start and stop the server for tests
const startServer = () => server.start();
const stopServer = (app) => app.close();

describe('Sapix API Cookie Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = startServer();
  });

  afterAll(() => {
    stopServer(app);
  });

  it('should set a simple session_id cookie at root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to SapixRoutes Home Page!');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('session_id=abc123')
      ])
    );
  });

  it('should set complex cookies on /complex route', async () => {
    const response = await request(app).get('/complex');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Complex cookies have been set successfully!');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('preferences='),
        expect.stringContaining('activities='),
        expect.stringContaining('sessionData='),
      ])
    );
  });

  it('should set a JWT token cookie on /jwt route', async () => {
    const response = await request(app).get('/jwt');
    expect(response.status).toBe(200);
    expect(response.text).toBe('JWT token has been set in a secure cookie!');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6')
      ])
    );
  });

  it('should handle multiple cookies set as a string on /withString route', async () => {
    const response = await request(app).get('/withString');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Multiple cookies have been set using a single cookie string!');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should set a single cookie using a string on /withSingleCookieString route', async () => {
    const response = await request(app).get('/withSingleCookieString');
    expect(response.status).toBe(200);
    expect(response.text).toBe('A single cookie has been set using a cookie string!');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('sessionId=abc123')
      ])
    );
  });

  it('should return 200 error for invalid cookie string on /withInvalidString route', async () => {
    const response = await request(app).get('/withInvalidString');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Attempted to set an invalid cookie string!');
  });

  it('should return 400 error for missing cookie name on /invalid/missing-name route', async () => {
    const response = await request(app).get('/invalid/missing-name');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":{}}");
  });

  it('should return 400 error for missing cookie value on /invalid/missing-value route', async () => {
    const response = await request(app).get('/invalid/missing-value');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":{}}");
  });

  it('should return 400 error for negative Max-Age on /invalid/max-age route', async () => {
    const response = await request(app).get('/invalid/max-age');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":\"Max-Age should be a non-negative number\"}");
  });

  it('should return 400 error for unsupported SameSite on /invalid/samesite route', async () => {
    const response = await request(app).get('/invalid/samesite');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":\"SameSite value must be one of Lax, Strict, None\"}");
  });

  it('should return 400 error for oversized cookie on /invalid/size route', async () => {
    const response = await request(app).get('/invalid/size');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":\"Cookie value cannot increase more than 4kb\"}");
  });

  it('should return 400 error for mixed valid and invalid cookies on /mixed route', async () => {
    const response = await request(app).get('/mixed');
    expect(response.status).toBe(400);
    expect(response.text).toContain("{\"error\":\"Cookie name and value are required\"}");
  });

  it('should retrieve and deserialize complex cookies on /retrieve route', async () => {
    const response = await request(app).get('/retrieve').set('Cookie', [
      'preferences={"theme":"dark","language":"en","notifications":{"email":true,"sms":false}}',
      'activities=["login","viewed_profile","logout"]',
      'sessionData={"token":"xyz789","expires":"2024-12-31T23:59:59Z"}'
    ]);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          sms: false,
        },
      },
      activities: ['login', 'viewed_profile', 'logout'],
      sessionData: {
        token: 'xyz789',
        expires: '2024-12-31T23:59:59Z',
      },
    });
  });
});

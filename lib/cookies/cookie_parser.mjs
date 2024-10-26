// CookieParser.js
import Cookie from './cookie.mjs';

export default class CookieParser {
  /**
   * Parses the 'Cookie' header from an HTTP request into a Map of Cookie instances.
   * 
   * @param {string} cookieString - The raw cookie string from the 'Cookie' header.
   * @returns {Map<string, Cookie>} - A Map where the keys are cookie names and values are Cookie instances.
   */
  static parse(cookieString) {
    if (typeof cookieString !== 'string' || !cookieString.trim()) {
      throw new Error('Invalid or empty cookie string');
    }

    const cookies = new Map();
    let currentCookie = null;

    // Split the cookie string by ';' and iterate over key-value pairs
    cookieString.split(';').forEach(part => {
      const [rawKey, ...rawValueParts] = part.split('=');
      const key = rawKey.trim();
      const value = rawValueParts.join('=').trim();

      // List of recognized attributes
      const attributes = ['Expires', 'Max-Age', 'Path', 'HttpOnly', 'Secure', 'SameSite'];

      if (attributes.includes(key)) {
        if (currentCookie) {
          // Assign attributes to the current cookie
          switch (key) {
            case 'Expires':
              currentCookie.expires = value;
              break;
            case 'Max-Age':
              currentCookie.maxAge = Number(value);
              break;
            case 'Path':
              currentCookie.path = value;
              break;
            case 'HttpOnly':
              currentCookie.httpOnly = true;
              break;
            case 'Secure':
              currentCookie.secure = true;
              break;
            case 'SameSite':
              currentCookie.sameSite = value;
              break;
            default:
              break;
          }
        }
      } else {
        // Assume it's a cookie name=value pair
        const decodedValue = decodeURIComponent(value);
        currentCookie = new Cookie(key, decodedValue);
        cookies.set(key, currentCookie);
      }
    });

    return cookies;
  }

  /**
   * Converts a Map of Cookie instances into a string suitable for a 'Set-Cookie' header.
   * 
   * @param {Map<string, Cookie>} cookies - A Map of Cookie instances to serialize.
   * @returns {string[]} - An array of serialized cookies in 'Set-Cookie' header format.
   */
  static serialize(cookies) {
    if (!(cookies instanceof Map)) {
      throw new TypeError('Cookies must be a Map of Cookie objects');
    }

    return Array.from(cookies.values()).map(cookie => cookie.toString());
  }

  /**
   * Validates if a given cookie string follows the correct format.
   * 
   * @param {string} cookieString - The raw cookie string to validate.
   * @returns {boolean} - Returns true if the cookie string is valid, false otherwise.
   */
  static validate(cookieString) {
    if (typeof cookieString !== 'string' || !cookieString.trim()) {
      return false;
    }

    const attributes = ['Expires', 'Max-Age', 'Path', 'HttpOnly', 'Secure', 'SameSite'];
    let isValid = true;
    let currentCookie = false;

    cookieString.split(';').forEach(part => {
      const [rawKey, ...rawValueParts] = part.split('=');
      const key = rawKey.trim();
      const value = rawValueParts.join('=').trim();

      if (attributes.includes(key)) {
        // Attribute should follow a cookie
        if (!currentCookie) {
          isValid = false;
        }
      } else {
        // Assume it's a cookie name=value pair
        if (!key || !value) {
          isValid = false;
        } else {
          currentCookie = true;
        }
      }
    });

    return isValid;
  }

  /**
   * Extracts a specific cookie by name from the cookie string.
   * If the cookie is not found, it returns null.
   * 
   * @param {string} cookieString - The raw cookie string from the 'Cookie' header.
   * @param {string} name - The name of the cookie to retrieve.
   * @returns {Cookie|null} - The Cookie instance or null if not found.
   */
  static getCookie(cookieString, name) {
    const cookies = this.parse(cookieString);
    return cookies.get(name) || null;
  }
}

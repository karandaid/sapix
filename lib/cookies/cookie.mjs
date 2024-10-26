// Cookie.js
export default class Cookie {
  constructor(name, value, options = {}) {
    if (!name || (value === undefined || value === null)) {
      throw new Error('Cookie name and value are required');
    }

    this._name = name;
    this.value = value; // Use the setter for serialization

    // Assign options with sensible defaults
    const {
      expires = null,
      maxAge = null,
      path = '/',
      httpOnly = false,
      secure = false,
      sameSite = 'Lax',
    } = options;

    this.expires = this._validateDate(expires);
    this.maxAge = this._validateMaxAge(maxAge);
    this.path = path;
    this.httpOnly = httpOnly;
    this.secure = secure;
    this.sameSite = this._validateSameSite(sameSite);
  }

  // Getters
  get name() {
    return this._name;
  }

  get value() {
    return this._value;
  }

  get expires() {
    return this._expires;
  }

  get maxAge() {
    return this._maxAge;
  }

  get path() {
    return this._path;
  }

  get httpOnly() {
    return this._httpOnly;
  }

  get secure() {
    return this._secure;
  }

  get sameSite() {
    return this._sameSite;
  }

  // Setters
  set value(newValue) {
    if (newValue === undefined || newValue === null) {
      throw new Error('Cookie value cannot be undefined or null');
    }

    const _sValue = this._serializeValue(newValue);
    if(Buffer.byteLength(_sValue) > 4093 ) {
      throw new Error('Cookie value cannot increase more than 4kb');
    }
    this._originalValue = newValue;
    this._value = _sValue   
  }

  set expires(date) {
    this._expires = this._validateDate(date);
  }

  set maxAge(age) {
    this._maxAge = this._validateMaxAge(age);
  }

  set path(newPath) {
    this._path = newPath || '/';
  }

  set httpOnly(flag) {
    this._httpOnly = Boolean(flag);
  }

  set secure(flag) {
    this._secure = Boolean(flag);
  }

  set sameSite(sameSiteValue) {
    this._sameSite = this._validateSameSite(sameSiteValue);
  }

  // Private method to serialize value
  _serializeValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return encodeURIComponent(JSON.stringify(value));
    } catch (error) {
      throw new Error('Failed to serialize cookie value');
    }
  }

  // Method to deserialize value
  static deserializeValue(serializedValue) {
    try {
      const decoded = decodeURIComponent(serializedValue);
      return JSON.parse(decoded);
    } catch (error) {
      // If parsing fails, return the raw string
      return serializedValue;
    }
  }

  // Private method to validate the expiration date
  _validateDate(expires) {
    if (!expires) return null;
    const date = new Date(expires);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format for cookie expiration');
    }
    return date;
  }

  // Private method to validate the Max-Age
  _validateMaxAge(maxAge) {
    if (maxAge === null) return null;
    if (typeof maxAge !== 'number' || maxAge < 0) {
      throw new Error('Max-Age should be a non-negative number');
    }
    return maxAge;
  }

  // Private method to validate SameSite attribute
  _validateSameSite(sameSite) {
    const validSameSiteValues = ['Lax', 'Strict', 'None'];
    if (!validSameSiteValues.includes(sameSite)) {
      throw new Error(`SameSite value must be one of ${validSameSiteValues.join(', ')}`);
    }
    return sameSite;
  }

  // Method to convert cookie to Set-Cookie string
  toString() {
    let cookieStr = `${this.name}=${this._value}`;

    if (this.expires) {
      cookieStr += `; Expires=${this.expires.toUTCString()}`;
    }

    if (this.maxAge !== null) {
      cookieStr += `; Max-Age=${this.maxAge}`;
    }

    if (this.path) {
      cookieStr += `; Path=${this.path}`;
    }

    if (this.httpOnly) {
      cookieStr += '; HttpOnly';
    }

    if (this.secure) {
      cookieStr += '; Secure';
    }

    if (this.sameSite) {
      cookieStr += `; SameSite=${this.sameSite}`;
    }

    return cookieStr;
  }

  // Static method to parse a cookie string into a Cookie instance
  static parse(cookieStr) {
    const parts = cookieStr.split(';').map(part => part.trim());
    const [nameValue, ...attributes] = parts;
    const [name, value] = nameValue.split('=');

    const options = {};
    attributes.forEach(attr => {
      const [attrName, attrValue] = attr.split('=');
      switch (attrName.toLowerCase()) {
        case 'expires':
          options.expires = attrValue;
          break;
        case 'max-age':
          options.maxAge = Number(attrValue);
          break;
        case 'path':
          options.path = attrValue;
          break;
        case 'httponly':
          options.httpOnly = true;
          break;
        case 'secure':
          options.secure = true;
          break;
        case 'samesite':
          options.sameSite = attrValue;
          break;
        default:
          break;
      }
    });

    const cookie = new Cookie(name, decodeURIComponent(value), options);
    return cookie;
  }

  // Method to get the original complex value
  getOriginalValue() {
    return this._originalValue;
  }
}

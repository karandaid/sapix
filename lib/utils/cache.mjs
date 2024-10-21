// Cache.mjs

import { EventEmitter } from 'events';

/**
 * Represents an in-memory cache with support for TTL, LRU eviction, and event handling.
 */
class Cache extends EventEmitter {
  /**
   * Creates a new Cache instance.
   * @param {Object} [options={}]
   * @param {number} [options.cleanupInterval=5000] - Interval in milliseconds to clean expired keys.
   * @param {number} [options.maxSize=Infinity] - Maximum number of items in the cache.
   */
  constructor(options = {}) {
    super();
    const { cleanupInterval = 5000, maxSize = Infinity } = options;

    /** @private */
    this._cache = new Map(); // Stores the cache entries
    /** @private */
    this._maxSize = maxSize;
    /** @private */
    this._cleanupInterval = cleanupInterval;

    this._startCleanup();
  }

  /**
   * Starts the periodic cleanup of expired keys.
   * @private
   */
  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this._cache.entries()) {
        if (entry.expiry !== null && entry.expiry <= now) {
          this._cache.delete(key);
          this.emit('expired', key, entry.value);
        }
      }
    }, this._cleanupInterval);

    // Allow the process to exit if this is the only active timer
    this._cleanupTimer.unref();
  }

  /**
   * Stops the periodic cleanup.
   * @private
   */
  _stopCleanup() {
    clearInterval(this._cleanupTimer);
  }

  /**
   * Sets a value in the cache.
   * @param {string} key - The key to set.
   * @param {*} value - The value to store.
   * @param {number} [ttl] - Time-to-live in milliseconds. (default 24 hrs (86400000 ms))
   */
  set(key, value, ttl=86400000) {
    if (this._cache.has(key)) {
      this._cache.delete(key); // To update the order for LRU
    } else if (this._cache.size >= this._maxSize) {
      // Evict the least recently used (first inserted) key
      const lruKey = this._cache.keys().next().value;
      const lruEntry = this._cache.get(lruKey);
      this._cache.delete(lruKey);
      this.emit('evict', lruKey, lruEntry.value);
    }

    const expiry = typeof ttl === 'number' ? Date.now() + ttl : null;
    this._cache.set(key, { value, expiry });
    this.emit('set', key, value);

    if (expiry !== null) {
      setTimeout(() => {
        const currentEntry = this._cache.get(key);
        if (currentEntry && currentEntry.expiry <= Date.now()) {
          this._cache.delete(key);
          this.emit('expired', key, currentEntry.value);
        }
      }, ttl).unref(); // Ensures the timer does not keep the process alive
    }
  }

  /**
   * Retrieves a value from the cache.
   * @param {string} key - The key to retrieve.
   * @returns {*} The value, or undefined if not found or expired.
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) return undefined;

    if (entry.expiry !== null && entry.expiry <= Date.now()) {
      this._cache.delete(key);
      this.emit('expired', key, entry.value);
      return undefined;
    }

    // Update the key's position for LRU
    this._cache.delete(key);
    this._cache.set(key, entry);
    this.emit('get', key, entry.value);
    return entry.value;
  }

  /**
   * Deletes a key from the cache.
   * @param {string} key - The key to delete.
   * @returns {boolean} True if the key was deleted, false otherwise.
   */
  delete(key) {
    if (this._cache.has(key)) {
      const entry = this._cache.get(key);
      this._cache.delete(key);
      this.emit('delete', key, entry.value);
      return true;
    }
    return false;
  }

  /**
   * Clears all keys from the cache.
   */
  clear() {
    for (const [key, entry] of this._cache.entries()) {
      this._cache.delete(key);
      this.emit('delete', key, entry.value);
    }
  }

  /**
   * Returns the number of items in the cache.
   * @returns {number} The cache size.
   */
  size() {
    return this._cache.size;
  }

  /**
   * Lists all keys in the cache.
   * @returns {string[]} An array of keys.
   */
  keys() {
    return Array.from(this._cache.keys());
  }

  /**
   * Stops the cache and cleans up resources.
   */
  stop() {
    this._stopCleanup();
    this.clear();
  }
}

export default Cache;

// Blake2Hasher.mjs
import { createHash, getHashes } from 'crypto';

export class Blake2Hasher {
  /**
   * Constructs a new Blake2Hasher instance.
   * @param {Object} [options] - Optional configurations.
   * @param {number} [options.digestLength=32] - Desired digest length in bytes.
   * @param {'blake2b' | 'blake2s'} [options.algorithm='blake2b'] - BLAKE2 algorithm variant.
   */
  constructor(options = {}) {
    const { digestLength = 64, algorithm = 'blake2b' } = options;
    this.algorithm = this._determineAlgorithm(algorithm, digestLength);
  }

  /**
   * Determines the appropriate algorithm name based on the requested variant and digest length.
   * @param {'blake2b' | 'blake2s'} algorithm - The BLAKE2 variant.
   * @param {number} digestLength - Desired digest length in bytes.
   * @returns {string} - The complete algorithm name supported by Node.js.
   * @private
   */
  _determineAlgorithm(algorithm, digestLength) {
    const algoMap = {
      blake2b: {
        64: 'blake2b512',
      },
      blake2s: {
        32: 'blake2s256',
      },
    };

    const supportedAlgos = algoMap[algorithm];
    if (!supportedAlgos) {
      throw new Error(`Unsupported algorithm variant: ${algorithm}`);
    }

    const algoName = supportedAlgos[digestLength];
    if (!algoName) {
      const supportedLengths = Object.keys(supportedAlgos).map(Number);
      throw new Error(
        `Unsupported digest length for ${algorithm}. Supported lengths: ${supportedLengths.join(
          ', '
        )} bytes.`
      );
    }

    // Verify if the algorithm is supported in the current Node.js environment
    const availableAlgos = getHashes();
    if (!availableAlgos.includes(algoName)) {
      throw new Error(`Algorithm ${algoName} is not supported in this Node.js version.`);
    }

    return algoName;
  }

  /**
   * Hashes the provided data and returns a hexadecimal string.
   * @param {*} data - The data to hash.
   * @returns {string} - The resulting hash as a hex string.
   */
  hash(data) {
    const serialized = this._serialize(data);
    const hash = createHash(this.algorithm);
    hash.update(serialized);
    return hash.digest('hex');
  }

  /**
   * Serializes data into a deterministic string representation.
   * @param {*} data - The data to serialize.
   * @returns {string} - The serialized string.
   * @private
   */
  _serialize(data) {
    const seen = new WeakSet();

    const serializeHelper = (item) => {
      if (item === null) return 'null';
      if (item === undefined) return 'undefined';

      const type = typeof item;

      if (type === 'number' || type === 'boolean') {
        return item.toString();
      }

      if (type === 'string') {
        return JSON.stringify(item);
      }

      if (type === 'function') {
        return `function:${item.toString()}`;
      }

      if (type === 'object') {
        if (seen.has(item)) {
          throw new TypeError('Converting circular structure to hash');
        }
        seen.add(item);

        if (Array.isArray(item)) {
          return `[${item.map(serializeHelper).join(',')}]`;
        }

        if (item instanceof Map) {
          const mapArray = Array.from(item.entries())
            .sort(([a], [b]) => this._compare(a, b))
            .map(
              ([key, value]) => `[${serializeHelper(key)},${serializeHelper(value)}]`
            );
          return `Map{${mapArray.join(',')}}`;
        }

        if (item instanceof Set) {
          const setArray = Array.from(item)
            .sort(this._compare)
            .map(serializeHelper);
          return `Set{${setArray.join(',')}}`;
        }

        // Handle class instances by capturing their constructor name and properties
        if (item.constructor && item.constructor !== Object) {
          const constructorName = item.constructor.name;
          const props = Object.keys(item)
            .sort()
            .map((key) => `${key}:${serializeHelper(item[key])}`)
            .join(',');
          return `Class{${constructorName}:{${props}}}`;
        }

        // Regular objects
        const keys = Object.keys(item).sort();
        const objString = keys
          .map((key) => `${key}:${serializeHelper(item[key])}`)
          .join(',');
        return `{${objString}}`;
      }

      // Fallback for other types
      return '';
    };

    return serializeHelper(data);
  }

  /**
   * Compares two values for sorting.
   * @param {*} a - First value.
   * @param {*} b - Second value.
   * @returns {number} - Comparison result.
   * @private
   */
  _compare(a, b) {
    const typeA = typeof a;
    const typeB = typeof b;

    if (typeA === typeB) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }

    return typeA < typeB ? -1 : 1;
  }
}

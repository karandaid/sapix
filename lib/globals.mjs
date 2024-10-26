import Cache from './utils/cache.mjs';
import Blake2Hasher from './utils/blake3_hasher.mjs'

/**
 * Singleton Cache Instance
 */
const cacheInstance = new Cache({ cleanupInterval: 6000000, maxSize: 1000 });

// // Event listeners
// cacheInstance.on('set', (key, value) => {
//     console.log(`Set key "${key}" with value:`, value);
// });

// cacheInstance.on('get', (key, value) => {
//     console.log(`Accessed key "${key}" with value:`, value);
// });

// cacheInstance.on('delete', (key, value) => {
//     console.log(`Deleted key "${key}" with value:`, value);
// });

// cacheInstance.on('expired', (key, value) => {
//     console.log(`Key "${key}" expired and was removed.`);
// });

// cacheInstance.on('evict', (key, value) => {
//     console.log(`Evicted key "${key}" due to cache size limit.`);
// });

const hasherInstance = new Blake2Hasher({ algorithm: 'blake2b', digestLength: 64 });

export { hasherInstance as hasher };
export default cacheInstance;

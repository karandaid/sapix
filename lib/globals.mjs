import Cache from './utils/cache.mjs';

/**
 * Singleton Cache Instance
 */
const cacheInstance = new Cache({ cleanupInterval: 6000000, maxSize: 1000 });

// Event listeners
cacheInstance.on('set', (key, value) => {
    console.log(`Set key "${key}" with value:`, value);
});

cacheInstance.on('get', (key, value) => {
    console.log(`Accessed key "${key}" with value:`, value);
});

cacheInstance.on('delete', (key, value) => {
    console.log(`Deleted key "${key}" with value:`, value);
});

cacheInstance.on('expired', (key, value) => {
    console.log(`Key "${key}" expired and was removed.`);
});

cacheInstance.on('evict', (key, value) => {
    console.log(`Evicted key "${key}" due to cache size limit.`);
});
export default cacheInstance;

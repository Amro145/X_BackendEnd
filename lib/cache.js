import NodeCache from "node-cache";

// stdTTL: 5 minutes, checkperiod: 2 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

export const getCache = (key) => {
    return cache.get(key);
};

export const setCache = (key, value, ttl = 300) => {
    return cache.set(key, value, ttl);
};

export const delCache = (key) => {
    return cache.del(key);
};

export const clearCacheByPrefix = (prefix) => {
    const keys = cache.keys();
    const keysToDelete = keys.filter((key) => key.startsWith(prefix));
    if (keysToDelete.length > 0) {
        cache.del(keysToDelete);
    }
};

export const flushCache = () => {
    cache.flushAll();
};

export default cache;

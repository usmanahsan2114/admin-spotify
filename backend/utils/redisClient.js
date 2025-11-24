const redis = require('redis');

let client;
let isConnected = false;

const initRedis = async () => {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    client = redis.createClient({
        url: redisUrl
    });

    client.on('error', (err) => {
        console.warn('Redis Client Error', err.message);
        isConnected = false;
    });

    client.on('connect', () => {
        console.log('Redis Client Connected');
        isConnected = true;
    });

    try {
        await client.connect();
    } catch (err) {
        console.warn('Failed to connect to Redis, proceeding without caching:', err.message);
        isConnected = false;
    }

    return client;
};

// Initialize connection
initRedis();

const get = async (key) => {
    // Debug log to check connection state
    // console.log(`[Redis] GET ${key}, connected: ${isConnected}, client exists: ${!!client}`);

    if (!isConnected || !client) {
        return null;
    }
    try {
        return await client.get(key);
    } catch (err) {
        console.warn(`Redis GET error for key ${key}:`, err.message);
        return null;
    }
};

const set = async (key, value, options = {}) => {
    if (!isConnected || !client) return false;
    try {
        // Default TTL: 5 minutes (300 seconds)
        const ttl = options.EX || 300;
        await client.set(key, value, { EX: ttl });
        return true;
    } catch (err) {
        console.warn(`Redis SET error for key ${key}:`, err.message);
        return false;
    }
};

const del = async (key) => {
    if (!isConnected || !client) return false;
    try {
        await client.del(key);
        return true;
    } catch (err) {
        console.warn(`Redis DEL error for key ${key}:`, err.message);
        return false;
    }
};

const delPattern = async (pattern) => {
    if (!isConnected || !client) return false;
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
        return true;
    } catch (err) {
        console.warn(`Redis DEL PATTERN error for ${pattern}:`, err.message);
        return false;
    }
};

module.exports = {
    get,
    set,
    del,
    delPattern,
    isConnected: () => isConnected
};

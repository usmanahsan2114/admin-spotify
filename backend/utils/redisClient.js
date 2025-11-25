// No-op Redis client - disabled to eliminate Redis errors
// All methods return immediately without doing anything

const get = async (key) => {
    // Always return null (cache miss)
    return null;
};

const set = async (key, value, options = {}) => {
    // Always return false (not cached)
    return false;
};

const del = async (key) => {
    // Always return false (nothing deleted)
    return false;
};

const delPattern = async (pattern) => {
    // Always return false (nothing deleted)
    return false;
};

module.exports = {
    get,
    set,
    del,
    delPattern,
    isConnected: () => false
};


/**
 * In-memory response cache middleware for read-heavy endpoints.
 *
 * Purpose: Reduce Firebase Firestore read consumption on the free Spark plan
 * (50,000 reads/day limit). Admin dashboard polls every 60s from potentially
 * multiple browser tabs. Without caching, each poll triggers 3–5 Firestore
 * collection reads per endpoint. With caching, only the FIRST request within
 * the TTL window hits Firestore; subsequent requests are served from memory.
 *
 * Usage:
 *   const { cache } = require('../middlewares/responseCache');
 *   router.get('/endpoint', cache(30), controller.handler);
 *
 * @param {number} ttlSeconds - Cache duration in seconds (default: 30)
 */

const store = new Map(); // { cacheKey: { data, expiresAt } }

// Periodically clean up expired entries to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(key);
    }
  }
}, 60_000); // Clean every minute

/**
 * Express middleware factory.
 * @param {number} ttlSeconds
 * @returns Express middleware function
 */
function cache(ttlSeconds = 30) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Cache key: method + URL (does NOT include auth header, so all users
    // of the same endpoint share the cache — suitable for admin read-only data)
    const key = `${req.method}:${req.originalUrl}`;
    const now = Date.now();
    const entry = store.get(key);

    if (entry && entry.expiresAt > now) {
      // Cache HIT — return cached response
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(entry.data);
    }

    // Cache MISS — intercept the response to store it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        store.set(key, {
          data:      body,
          expiresAt: now + ttlSeconds * 1000,
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 * Call this from write operations (POST/PATCH/DELETE) to ensure
 * the next read fetches fresh data.
 *
 * @param {string} urlPrefix - URL prefix to invalidate (e.g., '/api/admin')
 */
function invalidateCache(urlPrefix) {
  for (const key of store.keys()) {
    if (key.includes(urlPrefix)) {
      store.delete(key);
    }
  }
}

module.exports = { cache, invalidateCache };

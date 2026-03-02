import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request deduplication for GET requests ──
// Instead of aborting, share the same in-flight promise
const inflightRequests = new Map();

const getRequestKey = (config) => {
  if (config.method !== 'get') return null;
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Wrap API so duplicate GETs reuse the pending promise
const dedupedGet = API.get.bind(API);
API.get = (url, config = {}) => {
  const key = `get:${url}:${JSON.stringify(config.params || {})}`;
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }
  const promise = dedupedGet(url, config).finally(() => {
    inflightRequests.delete(key);
  });
  inflightRequests.set(key, promise);
  return promise;
};

// ── Response interceptor – retry on 5xx, auth redirect ──
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};

    // Skip retries for cancelled requests
    if (axios.isCancel(error)) return Promise.reject(error);

    // Redirect to login on 401
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Retry up to 2 times on 5xx or network errors (not for mutations)
    const retryable = !error.response || (error.response.status >= 500);
    const isSafe = ['get', 'head', 'options'].includes((config.method || '').toLowerCase());
    config.__retryCount = config.__retryCount || 0;

    if (retryable && isSafe && config.__retryCount < 2) {
      config.__retryCount += 1;
      const delay = config.__retryCount * 1000; // 1s, 2s
      await new Promise((r) => setTimeout(r, delay));
      return API(config);
    }

    return Promise.reject(error);
  }
);

export default API;

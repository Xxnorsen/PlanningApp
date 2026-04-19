const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('webm');

const BACKEND_HOST = 'web-production-2f6b.up.railway.app';

// Headers that must not be forwarded between proxy hops
const HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'transfer-encoding',
  'te', 'trailers', 'upgrade', 'proxy-authorization', 'proxy-authenticate',
]);

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (!req.url.startsWith('/api/')) {
        return middleware(req, res, next);
      }

      const targetPath = req.url.replace(/^\/api/, '') || '/';

      // Strip hop-by-hop headers before forwarding
      const forwardHeaders = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (!HOP_HEADERS.has(key.toLowerCase())) {
          forwardHeaders[key] = val;
        }
      }
      forwardHeaders['host'] = BACKEND_HOST;

      const proxyReq = https.request(
        {
          hostname: BACKEND_HOST,
          port: 443,
          path: targetPath,
          method: req.method,
          headers: forwardHeaders,
          timeout: 25000,
        },
        (proxyRes) => {
          // Strip hop-by-hop from response too
          const resHeaders = {};
          for (const [key, val] of Object.entries(proxyRes.headers)) {
            if (!HOP_HEADERS.has(key.toLowerCase())) {
              resHeaders[key] = val;
            }
          }
          res.writeHead(proxyRes.statusCode, resHeaders);
          // 204 No Content has no body — end immediately
          if (proxyRes.statusCode === 204) {
            res.end();
          } else {
            proxyRes.pipe(res, { end: true });
          }
        }
      );

      proxyReq.on('timeout', () => proxyReq.destroy());

      proxyReq.on('error', (err) => {
        console.error('[proxy]', req.method, targetPath, err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: err.message }));
        }
      });

      // GET/DELETE/HEAD have no body — end request immediately
      if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
        proxyReq.end();
      } else {
        req.pipe(proxyReq, { end: true });
      }
    };
  },
};

module.exports = config;

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

      const makeRequest = (method, path, headers, body) => {
        const proxyReq = https.request(
          {
            hostname: BACKEND_HOST,
            port: 443,
            path: path,
            method: method,
            headers: headers,
            timeout: 25000,
          },
          (proxyRes) => {
            // Follow redirects internally so CORS preflight isn't broken
            const status = proxyRes.statusCode;
            if ([301, 302, 307, 308].includes(status) && proxyRes.headers.location) {
              const loc = proxyRes.headers.location;
              try {
                const url = new URL(loc, `https://${BACKEND_HOST}`);
                const redirectMethod = [301, 302].includes(status) ? 'GET' : method;
                makeRequest(redirectMethod, url.pathname + url.search, headers, body);
              } catch {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ detail: 'Bad redirect location' }));
              }
              return;
            }
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
          console.error('[proxy]', method, path, err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: err.message }));
          }
        });

        if (body) {
          proxyReq.end(body);
        } else if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
          proxyReq.end();
        } else {
          req.pipe(proxyReq, { end: true });
        }
      };

      // Buffer body for methods that have one, so redirects can replay it
      const needsBody = !['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
      if (needsBody) {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          makeRequest(req.method, targetPath, forwardHeaders, Buffer.concat(chunks));
        });
      } else {
        makeRequest(req.method, targetPath, forwardHeaders, null);
      }
    };
  },
};

module.exports = config;

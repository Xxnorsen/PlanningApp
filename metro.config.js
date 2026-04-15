const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .webm animation files
config.resolver.assetExts.push('webm');

// Proxy /api/* → backend (fixes CORS on web)
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        createProxyMiddleware({
          target: 'https://web-production-2f6b.up.railway.app',
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
        })(req, res, next);
      } else {
        middleware(req, res, next);
      }
    };
  },
};

module.exports = config;

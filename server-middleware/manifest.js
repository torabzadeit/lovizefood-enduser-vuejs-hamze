const http = require('http');
const https = require('https');

const fallbackManifest = {
  id: '/',
  name: 'Loviz',
  short_name: 'Loviz',
  description: 'Loviz',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  lang: 'fa',
  icons: [
    { src: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
};

module.exports = function manifestProxy(req, res, next) {
  if (req.method !== 'GET' || req.url.split('?')[0] !== '/manifest.webmanifest') {
    return next();
  }

  const apiBaseUrl = process.env.API_URL || process.env.VUE_APP_BASE_URL || 'http://localhost:3003';
  let manifestUrl;
  try {
    manifestUrl = new URL('/api/core/manifest.webmanifest', apiBaseUrl);
  } catch (error) {
    return sendFallbackManifest(res);
  }

  const transport = manifestUrl.protocol === 'https:' ? https : http;
  const proxyRequest = transport.get(manifestUrl, (apiResponse) => {
    res.statusCode = apiResponse.statusCode || 502;
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    apiResponse.pipe(res);
  });

  proxyRequest.on('error', () => {
    if (!res.headersSent) return sendFallbackManifest(res);
    res.end();
  });
};

function sendFallbackManifest(res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.end(JSON.stringify(fallbackManifest));
}

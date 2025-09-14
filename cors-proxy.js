const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Add CORS headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxied response:', req.method, req.url, 'Status:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// Use the proxy for all routes
app.use('/', proxy);

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`CORS proxy server running on port ${PORT}`);
  console.log(`Proxying /* to http://localhost:3004/*`);
});

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

// Create proxy middleware - use localhost for host, host.docker.internal for Docker containers
const marquezUrl = process.env.MARQUEZ_URL || 'http://localhost:3004';
const proxy = createProxyMiddleware({
  target: marquezUrl,
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'cors-proxy' });
});

// Use the proxy for all other routes
app.use('/', proxy);

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`CORS proxy server running on port ${PORT}`);
  console.log(`Proxying /* to ${marquezUrl}/*`);
});

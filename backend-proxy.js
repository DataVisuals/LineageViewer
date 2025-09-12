const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3004;

// Enable CORS for React app
app.use(cors({
  origin: 'http://localhost:3003',
  credentials: true
}));

app.use(express.json());

// Proxy all /api requests to Marquez
app.use('/api', async (req, res) => {
  try {
    console.log(`Proxying ${req.method} ${req.url} to Marquez...`);
    console.log(`Full URL: ${req.originalUrl}`);
    
    const marquezUrl = `http://localhost:8080/api${req.url}`;
    console.log(`Marquez URL: ${marquezUrl}`);
    
    const response = await axios({
      method: req.method,
      url: marquezUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    
    console.log(`✅ Success: ${response.status} ${req.url}`);
    res.json(response.data);
  } catch (error) {
    console.error(`❌ Error proxying ${req.url}:`, error.message);
    console.error(`Error details:`, error.response?.data);
    res.status(error.response?.status || 500).json({
      error: 'Proxy error',
      message: error.message,
      details: error.response?.data
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend proxy running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to Marquez at http://localhost:8080`);
  console.log(`🔗 React app should use: http://localhost:${PORT}/api`);
});

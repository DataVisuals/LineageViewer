const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3006;

// Enable CORS
app.use(cors());
app.use(express.json());

// Proxy endpoint for Marquez API
app.get('/api/namespaces/:namespace/jobs', async (req, res) => {
  try {
    const { namespace } = req.params;
    const response = await axios.get(`http://localhost:8080/api/v1/namespaces/${namespace}/jobs`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching jobs:', error.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.get('/api/namespaces/:namespace/datasets', async (req, res) => {
  try {
    const { namespace } = req.params;
    const response = await axios.get(`http://localhost:8080/api/v1/namespaces/${namespace}/datasets`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching datasets:', error.message);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

app.get('/api/namespaces/:namespace/datasets/:dataset/versions/:version', async (req, res) => {
  try {
    const { namespace, dataset, version } = req.params;
    const response = await axios.get(`http://localhost:8080/api/v1/namespaces/${namespace}/datasets/${dataset}/versions/${version}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching dataset version:', error.message);
    res.status(500).json({ error: 'Failed to fetch dataset version' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

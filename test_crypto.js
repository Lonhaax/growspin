const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'backend/.env' });

const secret = 'f71d68a2e0bbec1b48cb4de5478469c7757d9d336c2258329d5db4083bb74eb4';
const token = jwt.sign({ userId: 1, role: 'admin' }, secret, { expiresIn: '1h' });

axios.post('http://localhost:3001/api/deposit/crypto/request', 
  { amountUSD: 10, payCurrency: "LTC" },
  { headers: { Authorization: `Bearer ${token}` } }
)
.then(res => console.log("SUCCESS:", res.data))
.catch(err => console.error("ERROR:", err.response ? err.response.data : err.message));

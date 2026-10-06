const jwt = require('jsonwebtoken');
const axios = require('axios');

const secret = 'f71d68a2e0bbec1b48cb4de5478469c7757d9d336c2258329d5db4083bb74eb4';
const token = jwt.sign({ userId: 1, role: 'admin' }, secret, { expiresIn: '1h' });

axios.post('https://api.growspin.lol/api/deposit/crypto/request', 
  { amountUSD: 10, payCurrency: "LTC" },
  { headers: { Authorization: `Bearer ${token}` } }
).then(res => console.log(res.data)).catch(err => console.error(err.response ? err.response.data : err.message));

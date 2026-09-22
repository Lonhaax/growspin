import jwt from 'jsonwebtoken';
import axios from 'axios';

const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret123';
const token = jwt.sign({ userId: 1 }, ACCESS_SECRET, { expiresIn: '15m' });

async function run() {
  try {
    const res = await axios.post('http://localhost:3001/api/cases/open', 
      { caseId: 1, demo: false, borrow: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Success:", res.data);
  } catch (err: any) {
    console.error("Error:", err.response?.status, err.response?.data);
  }
}
run();

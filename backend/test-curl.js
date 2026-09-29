"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret123';
const token = jsonwebtoken_1.default.sign({ userId: 1 }, ACCESS_SECRET, { expiresIn: '15m' });
async function run() {
    try {
        const res = await axios_1.default.post('http://localhost:3001/api/cases/open', { caseId: 1, demo: false, borrow: true }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Success:", res.data);
    }
    catch (err) {
        console.error("Error:", err.response?.status, err.response?.data);
    }
}
run();

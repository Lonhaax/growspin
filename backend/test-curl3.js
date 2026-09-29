"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const ACCESS_SECRET = process.env.JWT_SECRET || 'supersecret123';
const token = jsonwebtoken_1.default.sign({ userId: 1 }, ACCESS_SECRET, { expiresIn: '15m' });
async function run() {
    try {
        const c = await prisma.case.findFirst();
        if (!c)
            return console.log("No cases");
        const res = await axios_1.default.post('http://localhost:3001/api/cases/open', { caseId: c.id, demo: false, borrow: true }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Success:", res.data);
    }
    catch (err) {
        console.error("Error:", err.response?.status, err.response?.data);
    }
}
run();

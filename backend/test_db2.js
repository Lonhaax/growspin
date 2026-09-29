"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const res = await prisma.case.update({
            where: { id: 5 },
            data: {
                price: 100,
                name: "test",
                image: "",
                items: {
                    create: [{
                            name: "test",
                            imageUrl: "",
                            weight: 100000,
                            value: 100,
                            color: "#ffffff"
                        }]
                }
            }
        });
        console.log("Success");
    }
    catch (e) {
        console.log(e.message);
    }
}
main();

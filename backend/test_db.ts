import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const res = await prisma.case.update({
      where: { id: 5 },
      data: {
        items: {
          create: [{
            name: "test",
            imageUrl: "",
            weight: 1.4824820089082312e+22,
            value: 100,
            color: "#ffffff"
          }]
        }
      }
    })
    console.log("Success")
  } catch (e: any) {
    console.log(e.message)
  }
}
main()

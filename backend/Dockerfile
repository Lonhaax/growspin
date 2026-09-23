FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and C++ dependencies
RUN apt-get update -y && apt-get install -y openssl g++ libcurl4-openssl-dev

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile the C++ bot with custom Growtopia ENet
RUN g++ -o bot/enet_bot/bot bot/enet_bot/main.cpp node_modules/growtopia.js/lib/src/*.c -I node_modules/growtopia.js/lib/include/ -lcurl

EXPOSE 3001

CMD ["npm", "start"]

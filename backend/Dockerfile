FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and C++ dependencies
RUN apt-get update -y && apt-get install -y openssl g++ libenet-dev libcurl4-openssl-dev && ldconfig

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile the C++ bot
RUN g++ -o bot/enet_bot/bot bot/enet_bot/main.cpp -lenet -lcurl

EXPOSE 3001

CMD ["npm", "start"]

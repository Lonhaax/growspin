FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and build tools for crypto C++ bindings
RUN apt-get update -y && apt-get install -y openssl build-essential python3

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate


EXPOSE 3001

CMD ["npm", "start"]

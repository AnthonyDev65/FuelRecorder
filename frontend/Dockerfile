FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build for production
# (handled in docker-compose for dev mode)

EXPOSE 3000

CMD ["npm", "start"]

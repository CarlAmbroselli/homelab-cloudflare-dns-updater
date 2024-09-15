FROM node:20-alpine
WORKDIR /app

# Install bash and dig
RUN apk add --no-cache bash bind-tools

# Install deps with package.json and package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY app.js .
COPY helpers/dns.js ./helpers/
COPY helpers/health-checks.js ./helpers/

# Make the container have knowledge of environment variables
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "server.js"]

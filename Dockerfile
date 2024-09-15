FROM node:20-alpine
WORKDIR /app

# Install bash and dig
RUN apk add --no-cache bash bind-tools

# Install deps with package.json and package-lock.json
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY scripts/update-dns.js .
COPY scripts/health-server.js .

# Make cron have knowledge of environment variables
RUN env > /etc/environment

# Set up cron job
RUN echo '* * * * * cd /app && node /app/update-dns.js >> /var/log/cron.log 2>&1' > /etc/crontabs/root

# Setup entrypoint
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'crond -f -l 8 &' >> /app/start.sh && \
    echo 'node health-server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000
CMD ["/bin/bash", "start.sh"]

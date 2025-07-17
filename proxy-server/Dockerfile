# Use the official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock (if available) to leverage Docker cache
COPY proxy-server/package.json ./
COPY proxy-server/yarn.lock* ./

# Install dependencies
RUN npm install --production

# Copy the application code
COPY proxy-server/server.js ./
COPY proxy-server/public/oauth-callback.html ./public/

# Create the src/utils directory and copy embedScript.js
RUN mkdir -p src/utils
COPY src/utils/embedScript.js ./src/utils/

# Create the config directory for volume mounting
RUN mkdir -p config

# Expose the port the app runs on (default 3001, configurable via config)
EXPOSE 3005
EXPOSE 3001

# Set environment variables for production
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: process.env.PORT || 3001, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["node", "server.js"]

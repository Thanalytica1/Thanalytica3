# Use Node.js 20 Alpine for smaller image size and faster cold starts
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add curl for health checks (useful for Cloud Run)
RUN apk add --no-cache curl

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install production dependencies only
# Using npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && npm cache clean --force

# Copy the built application
COPY dist/ ./dist/

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port 8080 (Cloud Run's default)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Add health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
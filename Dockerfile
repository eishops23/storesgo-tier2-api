# =============================================================================
# 🐳 STORESGO BACKEND — PRODUCTION DOCKERFILE
# Multi-stage build optimized for production deployment
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Dependencies (cached layer)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# STAGE 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 storesgo

# Install runtime dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy any static assets/templates if needed
COPY --from=builder /app/src/templates ./dist/templates

# Create logs and uploads directories
RUN mkdir -p logs uploads && \
    chown -R storesgo:nodejs logs uploads

# Switch to non-root user
USER storesgo

# Expose the application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "dist/index.prod.js"]


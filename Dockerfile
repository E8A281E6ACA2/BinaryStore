# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build Next.js
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
COPY start.sh ./start.sh

# Make start.sh executable
RUN chmod +x start.sh

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Generate Prisma Client
RUN pnpm prisma:generate

# Copy built files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 60318

# Set environment
ENV NODE_ENV=production
ENV PORT=60318

# Start the application using the health check script
CMD ["./start.sh"]

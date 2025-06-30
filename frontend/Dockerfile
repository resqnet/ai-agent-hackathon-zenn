# Single-stage production image for Next.js
# Expects build artifacts to be already built by Cloud Build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built artifacts from Cloud Build
# Note: These files should already exist from the Cloud Build process
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

# Set ownership to the nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
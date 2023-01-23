# Fixed version to node 16, as node 17 is not supported by some dependencies
# 1. Install dependencies only when needed
FROM node:16-alpine AS deps

RUN apk add --no-cache libc6-compat yarn

WORKDIR /opt/app

COPY ../../package.json /opt/app
COPY ../../yarn.lock /opt/app

RUN yarn --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM node:16-alpine AS builder

WORKDIR /opt/app

COPY --from=deps /opt/app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npx nx run edu-hub:build

# 3. Production image, copy all the files and run next
FROM node:16-alpine AS runner

WORKDIR /opt/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /opt/app/next.config.js ./
COPY --from=builder /opt/app/public ./public
COPY --from=builder /opt/app/package.json ./package.json

# Automatically leverage output traces to reduce image size 
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /opt/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /opt/app/.next/static ./.next/static

USER nextjs

EXPOSE 25000

ENV PORT 25000

CMD [ "node", "server.js" ]

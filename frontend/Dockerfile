# Fixed version to node 16, as node 17 is not supported by some dependencies
FROM node:16-alpine

RUN mkdir -p /opt/app
RUN apk add --no-cache libc6-compat yarn

ENV PORT 25000
EXPOSE 25000

ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /opt/app

COPY package.json /opt/app
COPY yarn.lock /opt/app

RUN yarn

COPY . /opt/app

RUN yarn build

RUN npx next telemetry disable

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

CMD [ "yarn", "start" ]

FROM node:18-alpine AS builder
WORKDIR /app

ARG MUSIC_DIRECTORY

RUN mkdir -p ${MUSIC_DIRECTORY}

COPY package*.json ./
RUN npm ci
RUN apk add --no-cache ffmpeg

COPY . .

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production
RUN apk add --no-cache ffmpeg

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

CMD ["npx", "next", "start"]


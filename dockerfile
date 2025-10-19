FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production

COPY .next ./.next
COPY dist ./dist
COPY public ./public
COPY next.config.* ./

EXPOSE 3000

CMD ["node", "dist/server.js"]

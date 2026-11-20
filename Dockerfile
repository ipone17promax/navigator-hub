FROM node:20-alpine
WORKDIR /app
COPY render-proxy/package.json ./
COPY render-proxy/server.mjs ./
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
CMD ["node", "server.mjs"]
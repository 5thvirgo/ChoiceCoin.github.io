# Makwaya Kitchen: production image (zero npm dependencies).
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production PORT=8787 DATABASE_PATH=/data/makwaya.db
# Mount a persistent volume at /data (database) and /app/server/uploads (photos/videos).
VOLUME ["/data", "/app/server/uploads"]
EXPOSE 8787
CMD ["node", "server/server.mjs"]

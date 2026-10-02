# Mcuire Kitchen: production image (zero npm dependencies).
FROM node:22-slim
WORKDIR /app
COPY . .
# Database and uploaded photos/videos both live on one persistent disk at /data.
ENV NODE_ENV=production PORT=8787 DATABASE_PATH=/data/mcuire.db UPLOAD_DIR=/data/uploads
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server/server.mjs"]

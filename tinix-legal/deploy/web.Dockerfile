FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
WORKDIR /app/limi-product
COPY limi-product/ ./
COPY Prototype/dist/ /app/Prototype/dist/
RUN npm ci && npm run build && npm prune --omit=dev && chown -R node:node .next
USER node
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]

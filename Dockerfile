FROM node:14-alpine AS builder

COPY package.json *.js lerna.json *.md *.yml LICENSE /app/
COPY packages /app/packages/
COPY scripts /app/scripts/
WORKDIR /app

RUN cp package.json package.json.orig && \
  grep -v -e api-server -e styleguide package.json.orig > package.json && \
  npm install && \
  find node_modules/@ffprobe-installer -name ffprobe -exec chmod ugo+x {} \;

RUN npm run build --loglevel verbose

RUN node scripts/bundle.js --bundle-file=bundle-docker.yml && \
  cp dist/latest/home-gallery-*.tar.gz home-gallery.tar.gz

FROM node:14-alpine

RUN apk add --no-cache \
  perl

COPY --from=builder /app/home-gallery.tar.gz /app/home-gallery.tar.gz

RUN cd /app && \
  tar xvf /app/home-gallery.tar.gz && \
  rm /app/home-gallery.tar.gz

VOLUME [ "/data" ]

WORKDIR /data

ENV HOME=/data
ENV GALLERY_BASE_DIR=/data
ENV GALLERY_CONFIG_DIR=/data/config
ENV GALLERY_CACHE_DIR=/data
ENV GALLERY_CONFIG=/data/config/gallery.config.yml

EXPOSE 3000

ENTRYPOINT [ "node", "/app/gallery.js" ]

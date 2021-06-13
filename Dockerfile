# Image builder
FROM node:14-alpine AS builder

COPY package.json *.js lerna.json *.md *.yml LICENSE /build/
COPY packages /build/packages/
COPY scripts /build/scripts/
WORKDIR /build

RUN cp package.json package.json.orig && \
  grep -v -e api-server -e styleguide package.json.orig > package.json && \
  npm install && \
  find node_modules/@ffprobe-installer -name ffprobe -exec chmod ugo+x {} \;

RUN npm run build --loglevel verbose
RUN node scripts/bundle.js --bundle-file=bundle-docker.yml && \
  mkdir -p app && tar -xvf dist/latest/home-gallery-*.tar.gz -C app


# Final image
FROM node:14-alpine
LABEL org.opencontainers.image.authors="sebastian@silef.de"

RUN apk add --no-cache \
  perl

COPY --from=builder /build/app /app

VOLUME [ "/data" ]

WORKDIR /data

ENV HOME=/data
ENV GALLERY_BASE_DIR=/data
ENV GALLERY_CONFIG_DIR=/data/config
ENV GALLERY_CACHE_DIR=/data
ENV GALLERY_CONFIG=/data/config/gallery.config.yml

EXPOSE 3000

ENTRYPOINT [ "node", "/app/gallery.js" ]

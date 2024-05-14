# Image builder
FROM node:20-alpine AS builder
ARG TARGETPLATFORM
ARG NO_SHARP

COPY .npmrc *.json *.yaml *.js *.md *.yml LICENSE CHANGELOG.md CONTRIBUTING.md /build/
COPY e2e /build/e2e/
COPY packages /build/packages/
COPY scripts /build/scripts/
WORKDIR /build

RUN node scripts/disable-dependency.js api-server && \
  if [[ -n "$NO_SHARP" || "$TARGETPLATFORM" == "linux/arm/v6" || "$TARGETPLATFORM" == "linux/arm/v7" ]]; then node scripts/disable-dependency.js --prefix=packages/extractor sharp ; fi && \
  npm install --no-audit --loglevel verbose

RUN npm run build --loglevel verbose
RUN node scripts/bundle.js --bundle-file=bundle-docker.yml && \
  mkdir -p app && tar -xvf dist/latest/home-gallery-*.tar.gz -C app


# Final image
FROM node:20-alpine
LABEL org.opencontainers.image.authors="sebastian@silef.de"
LABEL org.opencontainers.image.url="https://home-gallery.org"
LABEL org.opencontainers.image.documentation="https://docs.home-gallery.org"
LABEL org.opencontainers.image.source="https://github.com/xemle/home-gallery"

RUN apk add --no-cache \
  ffmpeg \
  vips-tools \
  perl

COPY --from=builder /build/app /app

VOLUME [ "/data" ]

WORKDIR /data

ENV HOME=/data
ENV GALLERY_BASE_DIR=/data
ENV GALLERY_CONFIG_DIR=/data/config
ENV GALLERY_CACHE_DIR=/data
ENV GALLERY_CONFIG=/data/config/gallery.config.yml
ENV GALLERY_OPEN_BROWSER=false
ENV GALLERY_USE_NATIVE=ffprobe,ffmpeg
# Use polling for safety of possible network mounts. Try 0 to use inotify via fs.watch
ENV GALLERY_WATCH_POLL_INTERVAL=300

EXPOSE 3000

ENTRYPOINT [ "node", "/app/gallery.js" ]

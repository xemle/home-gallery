# Image builder
FROM node:14-alpine AS builder
ARG TARGETPLATFORM
ARG NO_SHARP

COPY package.json *.js lerna.json *.md *.yml LICENSE /build/
COPY e2e /build/e2e/
COPY packages /build/packages/
COPY scripts /build/scripts/
WORKDIR /build

# Use npm install --force due react-leaflet dep to react 18
RUN node scripts/disable-dependency.js api-server styleguide && \
  if [[ -n "$NO_SHARP" || "$TARGETPLATFORM" == "linux/arm/v6" || "$TARGETPLATFORM" == "linux/arm/v7" ]]; then node scripts/disable-dependency.js --prefix=packages/extractor sharp ; fi && \
  npm install --force

RUN npm run build --loglevel verbose
RUN node scripts/bundle.js --bundle-file=bundle-docker.yml && \
  mkdir -p app && tar -xvf dist/latest/home-gallery-*.tar.gz -C app


# Final image
FROM node:14-alpine
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

EXPOSE 3000

ENTRYPOINT [ "node", "/app/gallery.js" ]

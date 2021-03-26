FROM node:14-alpine

RUN apk add --no-cache \
  python \
  make \
  g++ \
  git \
  openssh-client \
  perl \
  vips-dev

COPY package.json *.js lerna.json *.md *.yml LICENSE /app/
COPY packages /app/packages/
WORKDIR /app

RUN cp package.json package.json.orig && \
  grep -v -e api-server -e styleguide package.json.orig > package.json && \
  npm install && \
  find node_modules/@ffprobe-installer -name ffprobe -exec chmod ugo+x {} \;

RUN npm run build -- --loglevel verbose && \
  npm prune --production && \
  npm cache clean --force && \
  rm -rf packages/webapp/{.cache,dist}

VOLUME [ "/data" ]
ENV GALLERY_BASE_DIR=/data
ENV GALLERY_CONFIG_DIR=/data/config
ENV GALLERY_CACHE_DIR=/data
ENV GALLERY_CONFIG=/data/config/gallery.config.yml
EXPOSE 3000

CMD [ "gallery.js" ]

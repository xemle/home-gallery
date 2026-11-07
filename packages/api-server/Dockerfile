FROM node:26 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY *.js ./

RUN node download-models.js

FROM node:26

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000

CMD [ "node", "index.js" ]

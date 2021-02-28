FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY *.js ./

RUN node download-models.js

EXPOSE 3000

CMD [ "node", "index.js" ]

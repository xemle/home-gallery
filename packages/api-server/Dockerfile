FROM node:12

WORKDIR /opt/app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY index.js .

EXPOSE 3000

CMD [ "node", "index.js" ]
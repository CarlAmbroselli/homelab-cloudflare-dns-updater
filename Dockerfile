FROM node:18

WORKDIR /usr/src/app
COPY package*.json ./
COPY main.js ./

RUN npm install
CMD [ "node", "main.js" ]

FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

COPY . .

EXPOSE 8001

CMD ["nodemon", "src/main.ts"]
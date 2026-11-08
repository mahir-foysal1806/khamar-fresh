FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN npm install --prefix client

COPY . .

RUN npm run build --prefix client

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]

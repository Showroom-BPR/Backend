FROM node:18.8.0-alpine3.16
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 82
RUN npm run build
CMD ["node", "dist/index.js"]
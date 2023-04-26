FROM node:18.8.0-alpine3.16
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 80
RUN npm run build --max-old-space-size=4096
CMD ["node", "dist/index.js"]
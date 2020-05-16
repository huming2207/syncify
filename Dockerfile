FROM node:lts-alpine
EXPOSE 3000/tcp
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY ./ /app/
RUN npm run build
RUN npm start

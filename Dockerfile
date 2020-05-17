FROM node:lts-alpine
EXPOSE 3000/tcp
WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY ./ /app/

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

RUN npm run build
CMD /wait && npm start

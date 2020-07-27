FROM node:10-stretch-slim
MAINTAINER i326432
RUN mkdir -p /app
ADD ./agile-tracker-service.tar.gz /app/
WORKDIR /app/agile-tracker-service/
RUN npm install
COPY start.sh /app/agile-tracker-service/start.sh
RUN chmod +x /app/agile-tracker-service/start.sh
EXPOSE 3000
CMD ["/app/agile-tracker-service/start.sh"]
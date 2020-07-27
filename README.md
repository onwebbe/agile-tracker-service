# Agile Tracker
Node Express based agile tracker

## System requirement
Database: mongodb<br/>
node 10<br/>

## Docker and DockerConfig
please use docker build in ./docker folder<br/>
go docker folder<br/>
run below command to create your docker<br/>
docker build -t agile-tracker-service :latest .


In docker-compose file, please define your network and also add mysql as link and dependency for this image, the network aliases should be 'mongodb'

## Docker Compose sample
version: "3"<br/>
networks:<br/>
  local:<br/>
  db_apps:<br/>
    driver: bridge<br/>
<br/>
services:<br/>
  mongodb:<br/>
    image: mongo:3.6.12<br/>
    ports:<br/>
      - 37117:27017<br/>
    networks:<br/>
      db_apps:<br/>
        aliases:<br/>
          - mongodb<br/>
    volumes:<br/>
      - /data/docker/docker-volumns/mongodb-data:/data/db<br/>
    container_name: mongoDB-Production<br/>
  aglie_tracker:<br/>
    image: 10.129.126.28:5000/agile-tracker-service<br/>
    container_name: agile-tracker<br/>
    depends_on: <br/>
      - mongodb <br/>
    ports:<br/>
      - 3000:3000<br/>
    networks:<br/>
      - db_apps<br/>
    restart: always <br/>

## Initialize Database
Initialize database data already exists under folder ./initialDatabase<br/>
Untar initialData.tar.gz and copy import script from importexportScript.sh
#!/bin/sh

# build our images
docker-compose -f docker-compose-prod.yml build

# tag them for upload to docker hub
docker tag recipemanager_nginx:latest cdignam/recipemanager_nginx:latest
docker tag recipemanager_django:latest cdignam/recipemanager_django:latest
docker tag recipemanager_react:latest cdignam/recipemanager_react:latest

# upload to docker hub
docker push cdignam/recipemanager_nginx:latest
docker push cdignam/recipemanager_django:latest
docker push cdignam/recipemanager_react:latest

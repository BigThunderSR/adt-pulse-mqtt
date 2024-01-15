#!/bin/bash

cd x-adt-pulse-mqtt-test-alpha

# Default build is based on homeassistant/amd64-base:latest
#docker build -t local/adt-pulse-mqtt .

# To specify a different platform, set build-arg to a different base image:
# homeassistant/armhf-base
# homeassistant/amd64-base
# homeassistant/aarch64-base
# homeassistant/i386-base

#docker build --build-arg BUILD_FROM="homeassistant/amd64-base:latest" -t local/adt-pulse-mqtt .

#docker build --build-arg BUILD_FROM="homeassistant/amd64-base:latest" -t local/adt-pulse-mqtt .

#docker build -t local/adt-pulse-mqtt .

docker build -f "Dockerfile-amd64" -t local/adt-pulse-mqtt-amd64 .

docker build -f "Dockerfile-aarch64" -t local/adt-pulse-mqtt-aarch64 .

docker build -f "Dockerfile-armhf" -t local/adt-pulse-mqtt-armhf .

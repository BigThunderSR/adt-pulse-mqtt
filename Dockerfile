ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG=C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    nodejs \
    npm

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ["package.json", "."]
RUN npm install --production

# Bundle app source
COPY [".", "."]

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]

#  Labels 

ARG BUILD_DESCRIPTION="ADT Pulse bridge for Home Assistant using MQTT"
ARG BUILD_NAME="ADT Pulse bridge for Home Assistant using MQTT Node18"
ARG BUILD_REPOSITORY="BigThunderSR/adt-pulse-mqtt"

LABEL \
    maintainer="BigThunderSR (https://github.com/BigThunderSR)" \
    org.opencontainers.image.title="${BUILD_NAME}" \
    org.opencontainers.image.description="${BUILD_DESCRIPTION}" \
    org.opencontainers.image.vendor="ADT Pulse bridge for Home Assistant using MQTT" \
    org.opencontainers.image.authors="BigThunderSR (https://github.com/BigThunderSR)" \    
    org.opencontainers.image.url="https://github.com/BigThunderSR" \
    org.opencontainers.image.source="https://github.com/${BUILD_REPOSITORY}" \
    org.opencontainers.image.documentation="https://github.com/${BUILD_REPOSITORY}/blob/main/README.md" 

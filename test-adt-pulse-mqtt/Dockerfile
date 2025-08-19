ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG=C.UTF-8
ENV NODE_ENV=production

# Install node and npm (Node 20+ LTS) - Required for modern JavaScript syntax and axios/undici
RUN apk add --no-cache \
    nodejs \
    npm

# Verify Node.js version meets requirements (>= 20)
RUN node --version

WORKDIR /usr/src/app

# Install app dependencies
COPY ["package.json", "/usr/src/app/"]
COPY ["package-lock.json", "/usr/src/app/"]

# Use npm ci for faster, reliable, reproducible builds
RUN npm ci --omit=dev --no-fund

# Bundle app source
COPY ./ /usr/src/app/

# Copy data for add-on
COPY run.sh /usr/src/app/
RUN chmod a+x /usr/src/app/run.sh

CMD [ "/usr/src/app/run.sh" ]

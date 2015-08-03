FROM node:0.12.7

MAINTAINER Adam Hooper <adam@adamhooper.com>

RUN groupadd -r app && useradd -r -g app app

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir -p /opt/app && mv /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
COPY . /opt/app/

USER app
WORKDIR /opt/app

ENV PORT 3000
EXPOSE 3000
CMD [ "node", "server.js" ]

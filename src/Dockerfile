FROM node:4.9-alpine AS base

FROM base as dep
WORKDIR /app
RUN apk add --no-cache python make gcc g++
COPY package*.json ./
RUN npm install

FROM base as final
WORKDIR /app
COPY --from=dep /app/node_modules /app/node_modules
COPY . .

EXPOSE 8080
CMD [ "node", "app.js" ]
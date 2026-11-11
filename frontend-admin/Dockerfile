# Desarrollo (docker-compose usa target: dev)
FROM node:24-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 3001

CMD ["npm", "start"]

# Build de producción
FROM dev AS build

# Se fija en tiempo de build (en Dokploy: Environment → Build-time Arguments)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Producción (etapa por defecto, la que usa Dokploy)
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

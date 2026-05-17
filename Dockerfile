FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

FROM nginx:alpine
# El nombre de la carpeta de salida depende del nombre del proyecto en angular.json
# En tu caso, se llama "ProyectoFinal"
COPY --from=build /app/dist/ProyectoFinal/browser /usr/share/nginx/html

# Copiamos la configuración de nginx para que funcione el enrutamiento de Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

FROM node:20-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm install --production

# Copiar el resto del código fuente del servidor
COPY . .

# Exponer el puerto por el que escucha Socket.io
EXPOSE 3000

# Comando para ejecutar en producción
CMD ["npm", "run", "prod"]

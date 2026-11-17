# ==========================================
# Etapa 1: Construcción (Build) de la SPA
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiesto de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar la aplicación estática de producción (genera /app/dist)
RUN npm run build

# ==========================================
# Etapa 2: Servidor Web de Producción (Nginx)
# ==========================================
FROM nginx:alpine AS runner

# Copiar configuración personalizada para manejar enrutamiento SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos compilados desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto estándar HTTP
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]

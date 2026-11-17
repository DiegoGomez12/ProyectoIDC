# ==========================================
# Etapa 1: Construcción (Build) de la SPA
# ==========================================
FROM node:24-alpine AS build

WORKDIR /app

# Argumento de compilación para la URL de la API (permite inyectarla en Azure / CI/CD)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalación estricta y reproducible de dependencias
RUN npm ci

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

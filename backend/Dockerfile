# ==========================================
# Etapa 1: Dependencias de Producción
# ==========================================
FROM node:24-alpine AS deps

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar exclusivamente dependencias de producción de forma reproducible
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# Etapa 2: Imagen Final de Producción (Runtime)
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production
ENV PORT=3000

# Copiar módulos de dependencias desde la etapa de construcción
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente y manifiesto
COPY package.json ./
COPY src ./src

# Usar usuario no privilegiado integrado en la imagen alpine por seguridad
USER node

# Exponer el puerto de la API
EXPOSE 3000

# Comando para aplicar el esquema de forma idempotente e iniciar la aplicación
CMD ["sh", "-c", "node src/db/init.js && exec node src/server.js"]

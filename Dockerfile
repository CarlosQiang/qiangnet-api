FROM node:18-alpine

# Instalar dependencias del sistema necesarias para Prisma y OpenSSL
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

# Configurar variables de entorno para OpenSSL
ENV OPENSSL_ROOT_DIR=/usr
ENV OPENSSL_LIBRARIES=/usr/lib
ENV OPENSSL_INCLUDE_DIR=/usr/include
ENV NODE_ENV=production

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con legacy-peer-deps para resolver conflictos
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S qiangnet -u 1001

# Crear directorios necesarios
RUN mkdir -p /app/logs && chown -R qiangnet:nodejs /app

# Copiar el resto del código
COPY --chown=qiangnet:nodejs . .

# Cambiar a usuario no-root
USER qiangnet

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicio para producción
CMD ["npm", "start"]

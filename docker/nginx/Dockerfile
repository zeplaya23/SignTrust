# ──────────────────────────────────────────────
# Stage 1 — Build the React frontend
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY signtrust-frontend/package.json signtrust-frontend/package-lock.json* ./

RUN npm ci

# Copy the rest of the frontend source
COPY signtrust-frontend/ ./

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 — Build the Console Admin frontend
# ──────────────────────────────────────────────
FROM node:20-alpine AS build-admin

WORKDIR /app

COPY signtrust-consoleadmin-frontend/package.json signtrust-consoleadmin-frontend/package-lock.json* ./

RUN npm ci

COPY signtrust-consoleadmin-frontend/ ./

RUN npm run build

# ──────────────────────────────────────────────
# Stage 3 — Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built tenant frontend from stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy built admin console from stage 2
COPY --from=build-admin /app/dist /usr/share/nginx/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

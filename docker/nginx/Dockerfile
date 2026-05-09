# ──────────────────────────────────────────────
# Stage 1 — Build the React frontend (desktop)
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY signtrust-frontend/package.json signtrust-frontend/package-lock.json* ./

RUN npm ci

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
# Stage 3 — Build the Web Mobile frontend
# ──────────────────────────────────────────────
FROM node:20-alpine AS build-mobile

WORKDIR /app

COPY signtrust-webmobile/package.json signtrust-webmobile/package-lock.json* ./

RUN npm ci

COPY signtrust-webmobile/ ./

RUN npm run build

# ──────────────────────────────────────────────
# Stage 4 — Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Desktop frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Admin console
COPY --from=build-admin /app/dist /usr/share/nginx/admin

# Mobile frontend
COPY --from=build-mobile /app/dist /usr/share/nginx/mobile

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

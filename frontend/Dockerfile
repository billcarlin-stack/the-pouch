# ──────────────────────────────────────────────────────────────
# The Hawk Hub — Frontend Dockerfile
# Production container for Google Cloud Run deployment
# ──────────────────────────────────────────────────────────────

FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Production Image ──────────────────────────────────────────
FROM nginx:alpine

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

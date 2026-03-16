# ──────────────────────────────────────────────────────────────
# The Hawk Hub — Frontend Dockerfile
# Production container for Google Cloud Run deployment
# ──────────────────────────────────────────────────────────────

FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept the API URL as a build argument so Vite bakes it into the JS bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production Image ──────────────────────────────────────────
FROM nginx:alpine

# Copy build artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

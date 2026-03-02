# Frontend Dockerfile 
# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config to handle React Router (SPA fallback)
RUN echo 'server { \
  listen 80; \
  location / { \
  root /usr/share/nginx/html; \
  try_files $uri $uri/ /index.html; \
  } \
  }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

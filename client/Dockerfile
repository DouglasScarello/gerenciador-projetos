# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Se houver configuração de rotas pro React (SPA), podemos adicionar um nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

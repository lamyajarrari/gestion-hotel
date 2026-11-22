FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# URL publique de l'API housekeeping, vue depuis le navigateur
ARG VITE_API_URL=http://localhost:8003
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_USERS_URL=http://localhost:3004
ENV VITE_USERS_URL=$VITE_USERS_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
